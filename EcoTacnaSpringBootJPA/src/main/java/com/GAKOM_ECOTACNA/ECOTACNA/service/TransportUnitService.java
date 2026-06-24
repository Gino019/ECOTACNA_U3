package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.TransportUnitRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ResourceNotFoundException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportUnit;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.TransportUnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.service.AuditLogService;

@Service
public class TransportUnitService {

    private static final Set<String> VALID_STATES = Set.of(
            "ACTIVO", "INACTIVO", "EN_MANTENIMIENTO", "NO_DISPONIBLE");

    private static final java.util.regex.Pattern STANDARD_RAW = java.util.regex.Pattern.compile("^[A-Z]{3}\\d{3}$");
    private static final java.util.regex.Pattern STANDARD_FORMATTED = java.util.regex.Pattern.compile("^[A-Z]{3}-\\d{3}$");
    private static final java.util.regex.Pattern SPECIAL_PLATE = java.util.regex.Pattern.compile("^[A-Z0-9]{6,8}$");

    private final TransportUnitRepository transportUnitRepository;
    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;
    private final SubscriptionValidator subscriptionValidator;

    @Autowired
    public TransportUnitService(TransportUnitRepository transportUnitRepository,
                                CompanyRepository companyRepository,
                                AuditLogService auditLogService,
                                SubscriptionValidator subscriptionValidator) {
        this.transportUnitRepository = transportUnitRepository;
        this.companyRepository = companyRepository;
        this.auditLogService = auditLogService;
        this.subscriptionValidator = subscriptionValidator;
    }

    public static String normalizePlate(String plate) {
        if (plate == null) {
            throw new BusinessException("Ingrese una placa válida. Use el formato ABC-123.");
        }
        
        // 1. Trim
        String normalized = plate.trim();
        
        // 2. Convertir a mayúsculas
        normalized = normalized.toUpperCase();
        
        // 3. Quitar espacios
        normalized = normalized.replace(" ", "");
        
        // 4. Permitir solo letras, números y guion
        if (!normalized.matches("^[A-Z0-9-]+$")) {
            throw new BusinessException("Ingrese una placa válida. Use el formato ABC-123.");
        }
        
        // 5. Si viene ABC-123, mantenerlo
        if (STANDARD_FORMATTED.matcher(normalized).matches()) {
            return normalized;
        }
        
        // 6. Si viene ABC123, convertir a ABC-123
        if (STANDARD_RAW.matcher(normalized).matches()) {
            return normalized.substring(0, 3) + "-" + normalized.substring(3);
        }
        
        // 7. Si viene placa especial alfanumérica de 6 a 8 caracteres, mantener sin guion
        if (SPECIAL_PLATE.matcher(normalized).matches()) {
            return normalized;
        }
        
        // 8. Si no cumple, lanzar error controlado
        throw new BusinessException("Ingrese una placa válida. Use el formato ABC-123.");
    }

    @Transactional(readOnly = true)
    public List<TransportUnit> listAll() {
        return transportUnitRepository.findAllWithCompany();
    }

    @Transactional(readOnly = true)
    public List<TransportUnit> listByCollectorCompany(Long companyId) {
        return transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Transactional(readOnly = true)
    public TransportUnit getById(Long id) {
        return transportUnitRepository.findByIdWithCompany(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transporte no encontrado."));
    }

    @Transactional
    public TransportUnit create(TransportUnitRequest request) {
        Company company = companyRepository.findById(request.getEmpresaRecolectoraId())
                .orElseThrow(() -> new ResourceNotFoundException("Empresa recolectora no encontrada."));
        if (company.getCompanyType() != CompanyType.RECOLECTORA) {
            throw new BusinessException("La empresa debe ser de tipo RECOLECTORA.");
        }

        String plate = normalizePlate(request.getPlaca());
        if (transportUnitRepository.existsByPlateExcludingId(plate, null)) {
            throw new BusinessException("La placa ya está registrada en otra unidad.");
        }

        if (request.getCapacidadLitros() != null && request.getCapacidadLitros().compareTo(java.math.BigDecimal.valueOf(5000)) > 0) {
            throw new IllegalArgumentException("La capacidad máxima permitida es 5000 litros.");
        }

        TransportUnit unit = TransportUnit.builder()
                .collectorCompany(company)
                .plate(plate)
                .brand(request.getMarca())
                .model(request.getModelo())
                .capacityLiters(request.getCapacidadLitros())
                .unitType(request.getTipoUnidad())
                .status(parseStatus(request.getEstado()))
                .observations(request.getObservaciones())
                .build();
        return transportUnitRepository.save(unit);
    }

    @Transactional
    public TransportUnit update(Long id, TransportUnitRequest request) {
        TransportUnit unit = getById(id);
        String plate = normalizePlate(request.getPlaca());
        if (transportUnitRepository.existsByPlateExcludingId(plate, id)) {
            throw new BusinessException("La placa ya está registrada en otra unidad.");
        }

        if (request.getCapacidadLitros() != null && request.getCapacidadLitros().compareTo(java.math.BigDecimal.valueOf(5000)) > 0) {
            throw new IllegalArgumentException("La capacidad máxima permitida es 5000 litros.");
        }
        unit.setPlate(plate);
        unit.setBrand(request.getMarca());
        unit.setModel(request.getModelo());
        unit.setCapacityLiters(request.getCapacidadLitros());
        unit.setUnitType(request.getTipoUnidad());
        unit.setStatus(parseStatus(request.getEstado()));
        unit.setObservations(request.getObservaciones());
        return transportUnitRepository.save(unit);
    }

    @Transactional
    public TransportUnit changeStatus(Long id, String newStatus) {
        TransportUnit unit = getById(id);
        unit.setStatus(parseStatus(newStatus));
        return transportUnitRepository.save(unit);
    }

    @Transactional
    public TransportUnit createForCollector(Company company, User user, TransportUnitRequest request, String ipAddress) {
        subscriptionValidator.ensureCollectorCanManageTransportUnits(company);

        long currentCount = transportUnitRepository.countByCollectorCompanyId(company.getId());
        if (currentCount >= 1) {
            throw new BusinessException("La empresa recolectora ya tiene un vehículo registrado. Edite la unidad existente.");
        }

        String plate = normalizePlate(request.getPlaca());
        if (transportUnitRepository.existsByPlateExcludingId(plate, null)) {
            throw new BusinessException("La placa ya está registrada en otra unidad.");
        }

        if (request.getCapacidadLitros() != null && request.getCapacidadLitros().compareTo(java.math.BigDecimal.valueOf(5000)) > 0) {
            throw new IllegalArgumentException("La capacidad máxima permitida es 5000 litros.");
        }

        TransportUnit unit = TransportUnit.builder()
                .collectorCompany(company)
                .plate(plate)
                .brand(request.getMarca())
                .model(request.getModelo())
                .capacityLiters(request.getCapacidadLitros())
                .unitType(request.getTipoUnidad())
                .status(parseStatus(request.getEstado()))
                .observations(request.getObservaciones())
                .build();
        
        TransportUnit savedUnit = transportUnitRepository.save(unit);

        if (auditLogService != null) {
            auditLogService.log(user, user.getEmail(), "CREAR_UNIDAD_TRANSPORTE", 
                    "Unidad creada con placa " + plate + " para empresa " + company.getBusinessName(), ipAddress);
        }

        return savedUnit;
    }

    @Transactional
    public TransportUnit updateForCollector(Long id, Company company, User user, TransportUnitRequest request, String ipAddress) {
        subscriptionValidator.ensureCollectorCanManageTransportUnits(company);
        
        TransportUnit unit = getById(id);
        
        if (!unit.getCollectorCompany().getId().equals(company.getId())) {
            throw new BusinessException("No puede modificar una unidad que no pertenece a su empresa.");
        }

        String plate = normalizePlate(request.getPlaca());
        if (transportUnitRepository.existsByPlateExcludingId(plate, id)) {
            throw new BusinessException("La placa ya está registrada en otra unidad.");
        }

        if (request.getCapacidadLitros() != null && request.getCapacidadLitros().compareTo(java.math.BigDecimal.valueOf(5000)) > 0) {
            throw new IllegalArgumentException("La capacidad máxima permitida es 5000 litros.");
        }
        
        unit.setPlate(plate);
        unit.setBrand(request.getMarca());
        unit.setModel(request.getModelo());
        unit.setCapacityLiters(request.getCapacidadLitros());
        unit.setUnitType(request.getTipoUnidad());
        unit.setStatus(parseStatus(request.getEstado()));
        unit.setObservations(request.getObservaciones());
        
        TransportUnit updatedUnit = transportUnitRepository.save(unit);

        if (auditLogService != null) {
            auditLogService.log(user, user.getEmail(), "ACTUALIZAR_UNIDAD_TRANSPORTE", 
                    "Unidad actualizada con placa " + plate + " (ID: " + id + ")", ipAddress);
        }

        return updatedUnit;
    }

    private TransportStatus parseStatus(String status) {
        String value = (status == null || status.isBlank()) ? "ACTIVO" : status.trim().toUpperCase();
        if (!VALID_STATES.contains(value)) {
            throw new BusinessException("Estado inválido. Valores: " + String.join(", ", VALID_STATES));
        }
        return TransportStatus.valueOf(value);
    }
}
