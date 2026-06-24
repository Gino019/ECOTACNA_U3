package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.RucLookupResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Role;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RegistrationStatusResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.DuplicateRegistrationException;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RegisterRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyBranch;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyBranchRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportUnit;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.TransportUnitRepository;
import java.util.List;

@Service
public class AuthService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final ApiPeruDevRucService apiPeruDevRucService;
    private final CompanyBranchRepository companyBranchRepository;
    private final TransportUnitRepository transportUnitRepository;

    @Autowired
    public AuthService(CompanyRepository companyRepository,
                       UserRepository userRepository,
                       AuditLogService auditLogService,
                       PasswordEncoder passwordEncoder,
                       ApiPeruDevRucService apiPeruDevRucService,
                       CompanyBranchRepository companyBranchRepository,
                       TransportUnitRepository transportUnitRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
        this.apiPeruDevRucService = apiPeruDevRucService;
        this.companyBranchRepository = companyBranchRepository;
        this.transportUnitRepository = transportUnitRepository;
    }

    /**
     * Registra una empresa formal B2B y crea su usuario administrador inicial.
     * Valida previamente el RUC de forma formal.
     */
    @Transactional
    public User registerCompany(RegisterRequest request, String ipAddress) {
        String ruc = request.getRuc();
        String email = request.getEmail();
        String password = request.getPassword();
        String confirmPassword = request.getConfirmPassword();
        String firstName = request.getFirstName();
        String lastName = request.getLastName();
        String phone = request.getPhone();
        Role role = request.getRole();

        if (role == Role.ADMIN) {
            throw new BusinessException("El rol ADMIN no puede registrarse por este endpoint.");
        }
        if (password == null || confirmPassword == null || !password.equals(confirmPassword)) {
            throw new BusinessException("Las contraseñas no coinciden.");
        }

        // Validaciones de coordenadas de ubicación principal
        java.math.BigDecimal mainLat = request.getLatitude();
        java.math.BigDecimal mainLng = request.getLongitude();

        if (mainLat == null || mainLng == null) {
            throw new BusinessException("La ubicación principal de la empresa es obligatoria.");
        }

        if (mainLat.compareTo(new java.math.BigDecimal("-90")) < 0 || mainLat.compareTo(new java.math.BigDecimal("90")) > 0 ||
            mainLng.compareTo(new java.math.BigDecimal("-180")) < 0 || mainLng.compareTo(new java.math.BigDecimal("180")) > 0) {
            throw new BusinessException("Las coordenadas de la empresa no son válidas.");
        }

        // Validaciones de sedes adicionales
        if (request.getBranches() != null) {
            java.util.Set<String> branchNames = new java.util.HashSet<>();
            java.util.Set<String> branchCoords = new java.util.HashSet<>();
            branchCoords.add(mainLat.setScale(7, java.math.RoundingMode.HALF_UP) + "," + mainLng.setScale(7, java.math.RoundingMode.HALF_UP));

            int branchIndex = 1;
            for (RegisterRequest.BranchRequest br : request.getBranches()) {
                if (br.getLatitude() == null || br.getLongitude() == null) {
                    throw new BusinessException("Las coordenadas de todas las sedes son obligatorias.");
                }
                if (br.getLatitude().compareTo(new java.math.BigDecimal("-90")) < 0 || br.getLatitude().compareTo(new java.math.BigDecimal("90")) > 0 ||
                    br.getLongitude().compareTo(new java.math.BigDecimal("-180")) < 0 || br.getLongitude().compareTo(new java.math.BigDecimal("180")) > 0) {
                    throw new BusinessException("Las coordenadas de la sede no son válidas.");
                }

                String name = br.getName();
                if (name == null || name.trim().isEmpty()) {
                    name = "Sede adicional " + branchIndex;
                } else {
                    name = name.trim();
                }

                if (branchNames.contains(name.toLowerCase())) {
                    throw new BusinessException("No se permite más de una sede con el mismo nombre.");
                }
                branchNames.add(name.toLowerCase());

                String coordStr = br.getLatitude().setScale(7, java.math.RoundingMode.HALF_UP) + "," + br.getLongitude().setScale(7, java.math.RoundingMode.HALF_UP);
                if (branchCoords.contains(coordStr)) {
                    throw new BusinessException("No se permiten coordenadas duplicadas entre sedes o con la sede principal.");
                }
                branchCoords.add(coordStr);

                branchIndex++;
            }
        }

        // 1. Validaciones previas de unicidad
        if (companyRepository.findByRuc(ruc).isPresent()) {
            RegistrationStatusResponse status = consultarEstadoRegistroPorRuc(ruc);
            status.setMessage("Esta empresa ya inició su registro. Puedes continuar desde la etapa actual.");
            throw new DuplicateRegistrationException("La empresa con RUC " + ruc + " ya se encuentra registrada.", status);
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException("El email corporativo " + email + " ya está registrado.");
        }

        String businessName;
        String address;
        String district;
        String province;
        String department;

        try {
            RucLookupResponse apiPeruResponse = apiPeruDevRucService.consultarRuc(ruc);
            businessName = apiPeruResponse.getRazonSocial();
            if (businessName == null || businessName.isBlank()) {
                throw new BusinessException("No se pudo obtener la razón social del proveedor externo.");
            }
            address = apiPeruResponse.getDireccionFiscal() != null && !apiPeruResponse.getDireccionFiscal().isBlank() ? apiPeruResponse.getDireccionFiscal() : "No registrada";
            district = apiPeruResponse.getDistrito();
            province = apiPeruResponse.getProvincia();
            department = apiPeruResponse.getDepartamento();
        } catch (BusinessException ex) {
            throw ex; // re-throw business exceptions
        } catch (Exception ex) {
            // Abortar si falla la API
            throw new BusinessException("No se pudo validar el RUC con el proveedor externo. Por favor, verifique el RUC o intente de nuevo más tarde.");
        }

        CompanyType resolvedType = PickupRequestService.resolveCompanyType(role, null); // companyType passed was null in AuthController

        // Validaciones de TransportUnit si es RECOLECTORA
        if (resolvedType == CompanyType.RECOLECTORA) {
            if (request.getTransportUnit() == null) {
                throw new BusinessException("Los datos de la unidad vehicular son obligatorios para empresas recolectoras.");
            }
            if (request.getTransportUnit().getCapacityLiters() != null && request.getTransportUnit().getCapacityLiters().compareTo(java.math.BigDecimal.valueOf(5000)) > 0) {
                throw new BusinessException("La capacidad máxima permitida es 5000 litros.");
            }
            if (transportUnitRepository.existsByPlateExcludingId(request.getTransportUnit().getPlate(), null)) {
                throw new BusinessException("La placa " + request.getTransportUnit().getPlate() + " ya está registrada.");
            }
        }

        Company company = Company.builder()
                .ruc(ruc)
                .businessName(businessName)
                .address(address)
                .district(district)
                .province(province)
                .department(department)
                .companyType(resolvedType)
                .latitude(mainLat)
                .longitude(mainLng)
                .build();
        company = companyRepository.save(company);

        // Guardar sedes adicionales
        if (request.getBranches() != null && !request.getBranches().isEmpty()) {
            java.util.List<CompanyBranch> branchesToSave = new java.util.ArrayList<>();
            int branchIndex = 1;
            for (RegisterRequest.BranchRequest br : request.getBranches()) {
                String name = br.getName();
                if (name == null || name.trim().isEmpty()) {
                    name = "Sede adicional " + branchIndex;
                } else {
                    name = name.trim();
                }
                CompanyBranch branch = CompanyBranch.builder()
                        .company(company)
                        .name(name)
                        .latitude(br.getLatitude())
                        .longitude(br.getLongitude())
                        .referenceAddress(br.getReferenceAddress())
                        .active(true)
                        .build();
                branchesToSave.add(branch);
                branchIndex++;
            }
            companyBranchRepository.saveAll(branchesToSave);
            company.setBranches(branchesToSave);
        }

        // 4. Normalizar teléfono y Crear Usuario Administrador de Empresa
        if (phone != null) {
            phone = phone.replaceAll("[^0-9]", "");
            if (phone.startsWith("51") && phone.length() == 11) {
                phone = phone.substring(2);
            }
            if (phone.length() != 9 || !phone.startsWith("9")) {
                throw new BusinessException("El teléfono debe ser un celular peruano válido de 9 dígitos que empiece con 9.");
            }
        }

        if (firstName == null || !firstName.matches("^(?!.*\\s{2,})(?!.*\\.{2,})(?![.\\-'\\s])(?!.*[.\\-'\\s]$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$") || firstName.length() < 3 || firstName.length() > 80) {
            throw new BusinessException("Ingrese un nombre de contacto válido. Use solo letras, espacios, punto, guion o apóstrofo.");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .role(role)
                .company(company)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        // Guardar la unidad vehicular si es recolectora
        if (resolvedType == CompanyType.RECOLECTORA) {
            TransportUnit unit = TransportUnit.builder()
                    .collectorCompany(company)
                    .plate(request.getTransportUnit().getPlate())
                    .brand(request.getTransportUnit().getBrand())
                    .model(request.getTransportUnit().getModel())
                    .unitType(request.getTransportUnit().getUnitType() != null ? request.getTransportUnit().getUnitType() : "Cisterna")
                    .capacityLiters(request.getTransportUnit().getCapacityLiters())
                    .status(TransportStatus.ACTIVO)
                    .build();
            transportUnitRepository.save(unit);
        }

        // 5. Auditar evento crítico
        auditLogService.log(
                user,
                email,
                "EMPRESA_REGISTRADA",
                "Registro exitoso de la empresa RUC " + ruc + " - " + company.getBusinessName() + " con rol " + role,
                ipAddress
        );

        return user;
    }

    /**
     * Valida las credenciales de un usuario y retorna la entidad si tiene acceso.
     */
    @Transactional(readOnly = true)
    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Credenciales incorrectas: El email corporativo no existe."));

        if (!user.isEnabled()) {
            throw new BusinessException("El usuario se encuentra deshabilitado. Comuníquese con soporte.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("Credenciales incorrectas: La contraseña provista es errónea.");
        }

        return user;
    }

    /**
     * Consulta el estado de registro de una empresa por RUC para permitir reanudación del flujo.
     */
    @Transactional(readOnly = true)
    public RegistrationStatusResponse consultarEstadoRegistroPorRuc(String ruc) {
        return companyRepository.findByRuc(ruc).map(company -> {
            String correoContacto = null;
            List<User> users = userRepository.findByCompanyId(company.getId());
            if (!users.isEmpty() && users.get(0).getEmail() != null) {
                correoContacto = users.get(0).getEmail();
            }

            String nextStep;
            String message;
            
            switch (company.getSubscriptionStatus()) {
                case PENDIENTE:
                    nextStep = "REVIEW_PENDING";
                    message = "Tu empresa está en revisión.";
                    break;
                case PENDIENTE_PAGO:
                    nextStep = "PAYMENT_PENDING";
                    message = "Tu empresa ha sido aprobada. Por favor, selecciona un plan o realiza el pago para continuar.";
                    break;
                case ACTIVA:
                case PRUEBA_ACTIVA:
                case SUSPENDIDA:
                case VENCIDA:
                    nextStep = "ACTIVE_LOGIN";
                    message = "Esta empresa ya está registrada. Inicia sesión con el correo asociado.";
                    break;
                case CANCELADA:
                    nextStep = "REJECTED";
                    message = "El registro o la cuenta de la empresa fue cancelada o rechazada.";
                    break;
                default:
                    nextStep = "UNKNOWN_STATE";
                    message = "Estado desconocido.";
            }

            return RegistrationStatusResponse.builder()
                    .exists(true)
                    .ruc(ruc)
                    .companyId(company.getId())
                    .razonSocial(company.getBusinessName())
                    .tipoEmpresa(company.getCompanyType() != null ? company.getCompanyType().name() : null)
                    .correoContacto(correoContacto)
                    .subscriptionStatus(company.getSubscriptionStatus().name())
                    .nextStep(nextStep)
                    .message(message)
                    .build();
        }).orElseGet(() -> 
            RegistrationStatusResponse.builder()
                    .exists(false)
                    .ruc(ruc)
                    .nextStep("NEW_REGISTRATION")
                    .build()
        );
    }
}
