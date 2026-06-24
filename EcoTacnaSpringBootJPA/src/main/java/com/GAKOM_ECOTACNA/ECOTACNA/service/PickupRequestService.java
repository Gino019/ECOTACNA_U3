package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupAssignmentRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RejectRequestDto;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ResourceNotFoundException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PickupRequestService {
    private final PickupRequestRepository pickupRequestRepository;
    private final UserRepository userRepository;
    private final TransportUnitRepository transportUnitRepository;
    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;
    private final SubscriptionValidator subscriptionValidator;
    private final CollectorRejectedRequestRepository rejectedRequestRepository;
    private final PickupRequestIncidentRepository incidentRepository;

    @Autowired
    public PickupRequestService(PickupRequestRepository pickupRequestRepository,
                                UserRepository userRepository,
                                TransportUnitRepository transportUnitRepository,
                                CompanyRepository companyRepository,
                                AuditLogService auditLogService,
                                SubscriptionValidator subscriptionValidator,
                                CollectorRejectedRequestRepository rejectedRequestRepository,
                                PickupRequestIncidentRepository incidentRepository) {
        this.pickupRequestRepository = pickupRequestRepository;
        this.userRepository = userRepository;
        this.transportUnitRepository = transportUnitRepository;
        this.companyRepository = companyRepository;
        this.auditLogService = auditLogService;
        this.subscriptionValidator = subscriptionValidator;
        this.rejectedRequestRepository = rejectedRequestRepository;
        this.incidentRepository = incidentRepository;
    }

    @Transactional
    public PickupRequest create(Company company, BigDecimal volume, LocalDateTime scheduledAt,
                                String direccion, String observaciones,
                                BigDecimal precioOfertadoPorLitro,
                                BigDecimal pickupLatitude, BigDecimal pickupLongitude,
                                String evidenciaUrl,
                                User creator, String ipAddress) {
        subscriptionValidator.validateActiveSubscription(company);

        PickupRequest active = findActiveRequestForCompany(company.getId());
        if (active != null) {
            throw new BusinessException("Ya tienes una solicitud activa. Finaliza, cancela o espera su vencimiento antes de registrar una nueva.");
        }

        if (company.getCompanyType() != CompanyType.GENERADORA) {
            throw new BusinessException("Solo empresas GENERADORAS pueden crear solicitudes de recojo.");
        }
        if (volume == null || volume.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El volumen aproximado debe ser mayor a 0.");
        }
        if (precioOfertadoPorLitro != null) {
            if (precioOfertadoPorLitro.compareTo(new BigDecimal("2.00")) < 0 || precioOfertadoPorLitro.compareTo(new BigDecimal("3.00")) > 0) {
                throw new BusinessException("El precio ofertado debe estar entre S/ 2.00 y S/ 3.00.");
            }
        }

        if (pickupLatitude != null || pickupLongitude != null) {
            if (pickupLatitude == null || pickupLongitude == null) {
                throw new BusinessException("Debe enviar latitud y longitud juntas para definir un punto geografico.");
            }
            if (pickupLatitude.compareTo(new BigDecimal("-90")) < 0 || pickupLatitude.compareTo(new BigDecimal("90")) > 0) {
                throw new BusinessException("La latitud debe estar entre -90 y 90.");
            }
            if (pickupLongitude.compareTo(new BigDecimal("-180")) < 0 || pickupLongitude.compareTo(new BigDecimal("180")) > 0) {
                throw new BusinessException("La longitud debe estar entre -180 y 180.");
            }
        }

        PickupRequest request = PickupRequest.builder()
                .company(company)
                .approximateVolumeLiters(volume)
                .scheduledAt(scheduledAt)
                .direccion(direccion)
                .observaciones(observaciones)
                .precioOfertadoPorLitro(precioOfertadoPorLitro)
                .pickupLatitude(pickupLatitude)
                .pickupLongitude(pickupLongitude)
                .evidenciaUrl(evidenciaUrl)
                .status(PickupRequestStatus.PENDIENTE)
                .build();
        request = pickupRequestRepository.save(request);

        auditLogService.log(creator, creator.getEmail(), "SOLICITUD_RECOJO_CREADA",
                "Solicitud #" + request.getId() + " por " + volume + " litros.", ipAddress);
        return request;
    }

    @Transactional
    public PickupRequest markAsEnSitio(Long id, Company collectorCompany, User collector, String ipAddress) {
        subscriptionValidator.validateActiveSubscription(collectorCompany);
        
        PickupRequest request = getById(id);
        if (!collector.getId().equals(request.getCollectorUserId())) {
            throw new BusinessException("No puede modificar una solicitud que no le ha sido asignada.");
        }
        if (request.getStatus() != PickupRequestStatus.EN_RUTA) {
            throw new BusinessException("La solicitud debe estar en estado EN_RUTA para cambiar a EN_SITIO.");
        }

        request.setStatus(PickupRequestStatus.EN_SITIO);
        request = pickupRequestRepository.save(request);

        auditLogService.log(collector, collector.getEmail(), "SOLICITUD_EN_SITIO",
                "Solicitud #" + id + " marcada como EN_SITIO", ipAddress);
        return request;
    }

    @Transactional
    public PickupRequest markAsEnRuta(Long id, Company collectorCompany, User collector, String ipAddress) {
        subscriptionValidator.validateActiveSubscription(collectorCompany);
        
        PickupRequest request = getById(id);
        if (!collector.getId().equals(request.getCollectorUserId())) {
            throw new BusinessException("No puede modificar una solicitud que no le ha sido asignada.");
        }
        if (request.getStatus() != PickupRequestStatus.PROGRAMADO) {
            throw new BusinessException("La solicitud debe estar en estado PROGRAMADO para cambiar a EN_RUTA.");
        }

        request.setStatus(PickupRequestStatus.EN_RUTA);
        request = pickupRequestRepository.save(request);

        auditLogService.log(collector, collector.getEmail(), "SOLICITUD_EN_RUTA",
                "Solicitud #" + id + " marcada como EN_RUTA", ipAddress);
        return request;
    }

    @Transactional
    public PickupRequest confirmPickup(Long id, Company collectorCompany, User collector, BigDecimal actualVolume, BigDecimal precioPorLitro, String ipAddress) {
        subscriptionValidator.validateActiveSubscription(collectorCompany);
        
        PickupRequest request = getById(id);
        if (!collector.getId().equals(request.getCollectorUserId())) {
            throw new BusinessException("No puede modificar una solicitud que no le ha sido asignada.");
        }
        if (request.getStatus() != PickupRequestStatus.PROGRAMADO
                && request.getStatus() != PickupRequestStatus.EN_RUTA 
                && request.getStatus() != PickupRequestStatus.EN_SITIO) {
            throw new BusinessException("La solicitud debe estar aceptada por el recolector para poder confirmar el recojo.");
        }
        if (actualVolume == null || actualVolume.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El volumen real recogido debe ser mayor a 0.");
        }
        if (precioPorLitro == null) {
            throw new BusinessException("El precio por litro es obligatorio al confirmar el recojo.");
        }
        if (precioPorLitro.compareTo(new BigDecimal("2.00")) < 0 || precioPorLitro.compareTo(new BigDecimal("3.00")) > 0) {
            throw new BusinessException("El precio por litro debe estar entre S/ 2.00 y S/ 3.00.");
        }
        request.setPrecioOfertadoPorLitro(precioPorLitro);
        request.setPrecioPorLitro(precioPorLitro);

        TransportUnit unitToValidate = request.getTransportUnit();
        if (unitToValidate == null) {
            List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(collectorCompany.getId());
            if (!units.isEmpty()) {
                unitToValidate = units.get(0);
            }
        }
        
        if (unitToValidate == null || unitToValidate.getCapacityLiters() == null) {
            throw new BusinessException("No se pudo validar la capacidad de la unidad asignada.");
        }
        
        BigDecimal maxCapacity = unitToValidate.getCapacityLiters();
        if (actualVolume.compareTo(maxCapacity) > 0) {
            String formattedCapacity = maxCapacity.stripTrailingZeros().toPlainString();
            throw new BusinessException("La cantidad de litros no puede superar la capacidad de la unidad recolectora: " + formattedCapacity + " L.");
        }

        request.setActualVolumeLiters(actualVolume);
        request.setLitrosConfirmados(actualVolume);
        request.setCollectedAt(LocalDateTime.now());
        
        // Cierre de flujo: el pago es externo y el recolector asume la responsabilidad de confirmarlo.
        BigDecimal montoTotal = actualVolume.multiply(precioPorLitro);
        request.setMontoTotal(montoTotal);
        request.setEstadoPago("PAGADO");
        request.setFechaConfirmacionPago(LocalDateTime.now());
        request.setObservacionPago("Pago externo registrado por el recolector.");
        
        request.setStatus(PickupRequestStatus.COMPLETADO);
        request = pickupRequestRepository.save(request);

        auditLogService.log(collector, collector.getEmail(), "SOLICITUD_COMPLETADA",
                "Solicitud #" + id + " completada por recolector. Volumen: " + actualVolume + "L, Monto: S/" + montoTotal, ipAddress);
        return request;
    }

    @Transactional(readOnly = true)
    public List<PickupRequest> listByCompany(Long companyId) {
        return pickupRequestRepository.findByCompanyIdOrderByRequestedAtDesc(companyId);
    }

    @Transactional(readOnly = true)
    public PickupRequest findActiveRequestForCompany(Long companyId) {
        List<PickupRequestStatus> activeStatuses = List.of(
            PickupRequestStatus.PENDIENTE,
            PickupRequestStatus.PROGRAMADO,
            PickupRequestStatus.EN_RUTA,
            PickupRequestStatus.EN_SITIO
        );
        PickupRequest req = pickupRequestRepository.findFirstActiveRequestByCompanyId(companyId, activeStatuses);
        
        if (req != null) {
            if (req.getStatus() == PickupRequestStatus.PENDIENTE) {
                LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
                if (req.getRequestedAt().plusDays(7).isAfter(now)) {
                    return req;
                }
                // Si es PENDIENTE pero ya expiro, no se considera activa.
                return null;
            }
            return req;
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<PickupRequest> listByCollector(Long collectorUserId) {
        return pickupRequestRepository.findByCollectorUserId(collectorUserId);
    }

    @Transactional
    public PickupRequest assignToCollector(Long pickupRequestId, PickupAssignmentRequest assignment,
                                           User admin, String ipAddress) {
        PickupRequest request = pickupRequestRepository.findById(pickupRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de recojo no encontrada."));

        if (request.getStatus() != PickupRequestStatus.PENDIENTE
                && request.getStatus() != PickupRequestStatus.PROGRAMADO) {
            throw new BusinessException("La solicitud no está en estado asignable.");
        }

        User collector = userRepository.findById(assignment.getRecolectorId())
                .orElseThrow(() -> new ResourceNotFoundException("Recolector no encontrado."));
        if (collector.getRole() != Role.RECOLECTOR) {
            throw new BusinessException("El usuario indicado no tiene rol RECOLECTOR.");
        }

        TransportUnit transportUnit = null;
        if (assignment.getTransporteId() != null) {
            transportUnit = transportUnitRepository.findById(assignment.getTransporteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidad vehicular no encontrada."));
            
            if (!transportUnit.getCollectorCompany().getId().equals(collector.getCompany().getId())) {
                throw new BusinessException("La unidad vehicular no pertenece a la empresa del recolector asignado.");
            }
            if (transportUnit.getStatus() != TransportStatus.ACTIVO) {
                throw new BusinessException("La unidad vehicular no está activa.");
            }
        }

        request.setCollectorUserId(collector.getId());
        request.setTransportUnit(transportUnit);
        request.setStatus(PickupRequestStatus.PROGRAMADO);
        if (request.getScheduledAt() == null) {
            request.setScheduledAt(LocalDateTime.now().plusDays(1));
        }
        request = pickupRequestRepository.save(request);

        auditLogService.log(admin, admin.getEmail(), "SOLICITUD_ASIGNADA",
                "Solicitud #" + pickupRequestId + " asignada al recolector " + collector.getEmail(), ipAddress);
        return request;
    }

    @Transactional(readOnly = true)
    public PickupRequest getById(Long id) {
        return pickupRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de recojo no encontrada."));
    }

    public static CompanyType resolveCompanyType(Role role, CompanyType requestedType) {
        if (requestedType != null) {
            return requestedType;
        }
        return switch (role) {
            case GENERADOR -> CompanyType.GENERADORA;
            case RECOLECTOR -> CompanyType.RECOLECTORA;
            default -> throw new IllegalArgumentException("Invalid role for company mapping");
        };
    }

    @Transactional(readOnly = true)
    public List<PickupRequest> getAvailableRequests(Company collectorCompany) {
        subscriptionValidator.validateActiveSubscription(collectorCompany);
        if (collectorCompany.getCompanyType() != CompanyType.RECOLECTORA) {
            throw new BusinessException("Solo empresas RECOLECTORAS pueden ver solicitudes disponibles.");
        }
        List<PickupRequest> raw = pickupRequestRepository.findAvailableRequests(collectorCompany.getId(), PickupRequestStatus.PENDIENTE);
        LocalDateTime limitTime = LocalDateTime.now(java.time.ZoneId.of("America/Lima")).minusDays(7);
        return raw.stream()
                .filter(req -> req.getRequestedAt().isAfter(limitTime))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public PickupRequest acceptRequest(Long id, User collector, Company collectorCompany, String ipAddress, BigDecimal precioPorLitro) {
        subscriptionValidator.validateActiveSubscription(collectorCompany);
        if (collectorCompany.getCompanyType() != CompanyType.RECOLECTORA) {
            throw new BusinessException("Solo empresas RECOLECTORAS pueden aceptar solicitudes.");
        }

        boolean tieneRecojoActivo = pickupRequestRepository.existsActiveRequestByCollectorCompanyId(
                collectorCompany.getId(),
                List.of(PickupRequestStatus.PROGRAMADO, PickupRequestStatus.EN_RUTA, PickupRequestStatus.EN_SITIO, PickupRequestStatus.RECOGIDO)
        );
        if (tieneRecojoActivo) {
            throw new BusinessException("Ya tienes un recojo en curso. Finaliza el actual antes de aceptar otro.");
        }

        PickupRequest request = getById(id);
        if (request.getStatus() != PickupRequestStatus.PENDIENTE) {
            throw new BusinessException("La solicitud ya no está disponible.");
        }

        LocalDateTime limitTime = LocalDateTime.now(java.time.ZoneId.of("America/Lima")).minusDays(7);
        if (request.getRequestedAt().isBefore(limitTime)) {
            throw new BusinessException("La solicitud ya vencio y no puede ser aceptada.");
        }

        if (request.getCollectorUserId() != null) {
            throw new BusinessException("Esta solicitud ya fue tomada por otro recolector.");
        }

        List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(collectorCompany.getId());
        if (units.isEmpty()) {
            throw new BusinessException("Debes tener una unidad vehicular activa para aceptar pedidos.");
        }
        
        TransportUnit activeUnit = units.get(0);
        if (request.getApproximateVolumeLiters() != null && activeUnit.getCapacityLiters() != null) {
            if (request.getApproximateVolumeLiters().compareTo(activeUnit.getCapacityLiters()) > 0) {
                throw new BusinessException("Este pedido supera la capacidad de tu unidad vehicular. Toma otro pedido compatible con tu capacidad.");
            }
        }

        request.setCollectorUserId(collector.getId());
        request.setStatus(PickupRequestStatus.EN_RUTA);
        request.setTransportUnit(activeUnit);

        if (request.getScheduledAt() == null) {
            request.setScheduledAt(LocalDateTime.now());
        }
        request = pickupRequestRepository.save(request);

        auditLogService.log(collector, collector.getEmail(), "SOLICITUD_ACEPTADA",
                "Solicitud #" + id + " aceptada por recolector.", ipAddress);
        return request;
    }

    @Transactional
    public void rejectRequest(Long id, Company collectorCompany, User reporterUser, RejectRequestDto dto) {
        PickupRequest request = getById(id);
        
        if (request.getStatus() == PickupRequestStatus.PENDIENTE) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("El rechazo previo a la aceptación ya no está disponible. Puedes omitir la solicitud.");
        }
        
        if (request.getStatus() == PickupRequestStatus.CANCELADO || request.getStatus() == PickupRequestStatus.COMPLETADO) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Esta solicitud ya fue cerrada y no admite otro rechazo.");
        }
        
        if (incidentRepository.existsByPickupRequestId(id)) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Ya existe una incidencia registrada para esta solicitud.");
        }
        
        if (dto != null && "OTROS".equals(dto.getMotivo()) && (dto.getObservacion() == null || dto.getObservacion().trim().isEmpty())) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Debes describir el motivo cuando seleccionas Otros.");
        }
        
        // El rechazo posterior a aceptación siempre cancela la solicitud
        request.setStatus(PickupRequestStatus.CANCELADO);
        
        if (dto != null) {
            PickupRequestIncident incident = PickupRequestIncident.builder()
                .pickupRequest(request)
                .reporterCompany(collectorCompany)
                .reporterUser(reporterUser)
                .reasonCode(dto.getMotivo())
                .reasonLabel(dto.getMotivo())
                .customReason("OTROS".equals(dto.getMotivo()) ? dto.getObservacion() : null)
                .description(dto.getObservacion())
                .status("CERRADA")
                .build();
            incidentRepository.save(incident);
        }
        
        // Ensure collector is free, though state CANCELADO achieves this logically
        // We will preserve the collector ID to know who rejected it for history tracking
        pickupRequestRepository.save(request);
    }

    @Transactional
    public PickupRequest cancelarSolicitudEmpresa(Long solicitudId, Company empresa, User reporterUser) {
        PickupRequest request = getById(solicitudId);

        if (!request.getCompany().getId().equals(empresa.getId())) {
            throw new BusinessException("No tienes permiso para cancelar esta solicitud.");
        }
        if (request.getStatus() != PickupRequestStatus.PENDIENTE) {
            throw new BusinessException("Solo se pueden cancelar solicitudes pendientes.");
        }

        request.setStatus(PickupRequestStatus.CANCELADO);
        request = pickupRequestRepository.save(request);

        PickupRequestIncident incident = PickupRequestIncident.builder()
            .pickupRequest(request)
            .reporterCompany(empresa)
            .reporterUser(reporterUser)
            .reasonCode("OTROS")
            .reasonLabel("Otros")
            .customReason("Cancelado por el generador")
            .description("La empresa generadora canceló la solicitud de recojo antes de ser asignada.")
            .status("CERRADA")
            .build();
        incidentRepository.save(incident);

        return request;
    }

    @Transactional(readOnly = true)
    public PickupRequest getActiveRequest(Long collectorUserId) {
        return pickupRequestRepository.findFirstActiveRequest(collectorUserId, 
            List.of(PickupRequestStatus.PROGRAMADO, PickupRequestStatus.EN_RUTA, PickupRequestStatus.EN_SITIO, PickupRequestStatus.RECOGIDO));
    }

    @Transactional(readOnly = true)
    public com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse getTrackingForGenerator(Long companyId) {
        PickupRequest active = pickupRequestRepository.findFirstActiveRequestByCompanyId(companyId, 
            List.of(PickupRequestStatus.PROGRAMADO, PickupRequestStatus.EN_RUTA, PickupRequestStatus.EN_SITIO, PickupRequestStatus.RECOGIDO));
        if (active == null) {
            return null;
        }
        return buildTrackingResponse(active);
    }

    public com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse buildTrackingResponse(PickupRequest active) {
        if (active == null) {
            return null;
        }
        com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse.PickupTrackingResponseBuilder builder = 
            com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse.builder()
                .solicitudId(active.getId())
                .estado(active.getStatus().name())
                .empresaGeneradora(active.getCompany().getBusinessName())
                .direccion(active.getDireccion())
                .volumenAproximado(active.getApproximateVolumeLiters())
                .fechaSolicitud(active.getRequestedAt())
                .fechaProgramada(active.getScheduledAt())
                .observaciones(active.getObservaciones())
                .precioOfertadoPorLitro(active.getPrecioOfertadoPorLitro())
                .montoEstimado(active.getApproximateVolumeLiters() != null && active.getPrecioOfertadoPorLitro() != null ? active.getApproximateVolumeLiters().multiply(active.getPrecioOfertadoPorLitro()) : null)
                .litrosConfirmados(active.getLitrosConfirmados())
                .precioPorLitro(active.getPrecioPorLitro())
                .montoTotal(active.getMontoTotal())
                .estadoPago(active.getEstadoPago())
                .fechaConfirmacionPago(active.getFechaConfirmacionPago())
                .observacionPago(active.getObservacionPago())
                .pickupLatitude(active.getPickupLatitude())
                .pickupLongitude(active.getPickupLongitude())
                .companyLatitude(active.getCompany() != null ? active.getCompany().getLatitude() : null)
                .companyLongitude(active.getCompany() != null ? active.getCompany().getLongitude() : null);

        if (active.getCollectorUserId() != null) {
            userRepository.findById(active.getCollectorUserId()).ifPresent(user -> {
                Company recolectorCompany = user.getCompany();
                builder.recolector(com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse.RecolectorInfo.builder()
                        .empresaRecolectoraId(recolectorCompany.getId())
                        .razonSocial(recolectorCompany.getBusinessName())
                        .ruc(recolectorCompany.getRuc())
                        .correo(user.getEmail())
                        .telefono(user.getPhone())
                        .build());
                        
                // If the transport unit is not explicitly set, fetch it from the collector company
                TransportUnit unitToUse = active.getTransportUnit();
                if (unitToUse == null) {
                    List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(recolectorCompany.getId());
                    if (!units.isEmpty()) {
                        unitToUse = units.get(0);
                    }
                }
                
                if (unitToUse != null) {
                    builder.unidad(com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse.UnidadInfo.builder()
                            .placa(unitToUse.getPlate())
                            .marca(unitToUse.getBrand())
                            .modelo(unitToUse.getModel())
                            .tipoUnidad(unitToUse.getUnitType())
                            .capacidadLitros(unitToUse.getCapacityLiters())
                            .build());
                    builder.collectorLatitude(unitToUse.getLastLatitude());
                    builder.collectorLongitude(unitToUse.getLastLongitude());
                }
            });
        } else if (active.getTransportUnit() != null) {
            TransportUnit unit = active.getTransportUnit();
            builder.unidad(com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse.UnidadInfo.builder()
                    .placa(unit.getPlate())
                    .marca(unit.getBrand())
                    .modelo(unit.getModel())
                    .tipoUnidad(unit.getUnitType())
                    .capacidadLitros(unit.getCapacityLiters())
                    .build());
            builder.collectorLatitude(unit.getLastLatitude());
            builder.collectorLongitude(unit.getLastLongitude());
        }

        return builder.build();
    }

    @Transactional
    public PickupRequest confirmarPago(Long id, Company company, User generatorUser,
                                      BigDecimal litrosConfirmados, String observacionPago, String ipAddress) {
        PickupRequest request = getById(id);
        
        if (!request.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("La solicitud no pertenece a su empresa.");
        }
        if (request.getCollectorUserId() == null) {
            throw new BusinessException("La solicitud no tiene un recolector asignado.");
        }
        if (request.getStatus() == PickupRequestStatus.COMPLETADO || "PAGADO".equalsIgnoreCase(request.getEstadoPago())) {
            throw new BusinessException("La solicitud ya ha sido completada y pagada.");
        }
        if (request.getStatus() == PickupRequestStatus.CANCELADO) {
            throw new BusinessException("La solicitud está cancelada.");
        }
        if (request.getStatus() != PickupRequestStatus.PROGRAMADO 
                && request.getStatus() != PickupRequestStatus.EN_RUTA 
                && request.getStatus() != PickupRequestStatus.EN_SITIO 
                && request.getStatus() != PickupRequestStatus.RECOGIDO) {
            throw new BusinessException("La solicitud no está en un estado activo para confirmar pago.");
        }
        
        if (litrosConfirmados == null || litrosConfirmados.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Los litros confirmados deben ser mayores a 0.");
        }
        
        BigDecimal precioAplicado = request.getPrecioOfertadoPorLitro();
        if (precioAplicado == null || precioAplicado.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("No se puede confirmar el pago porque la solicitud no tiene precio ofertado registrado.");
        }
        
        BigDecimal montoTotal = litrosConfirmados.multiply(precioAplicado);
        
        request.setLitrosConfirmados(litrosConfirmados);
        request.setPrecioPorLitro(precioAplicado);
        request.setMontoTotal(montoTotal);
        request.setEstadoPago("PAGADO");
        request.setFechaConfirmacionPago(LocalDateTime.now(java.time.ZoneId.of("America/Lima")));
        request.setObservacionPago(observacionPago);
        request.setStatus(PickupRequestStatus.COMPLETADO);
        
        request = pickupRequestRepository.save(request);
        
        auditLogService.log(generatorUser, generatorUser.getEmail(), "PAGO_OPERATIVO_CONFIRMADO",
                "Solicitud #" + id + " completada y pagada. Litros: " + litrosConfirmados + ", Total: S/ " + montoTotal, ipAddress);
                
        return request;
    }

    @Transactional(readOnly = true)
    public PickupRequest getConstanciaForCompany(Long id, Company company) {
        PickupRequest request = pickupRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de recojo no encontrada."));

        if (!request.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("No tiene permisos para descargar la constancia de esta solicitud.");
        }

        if (request.getStatus() != PickupRequestStatus.COMPLETADO || !"PAGADO".equals(request.getEstadoPago())) {
            throw new BusinessException("La constancia no está disponible porque la solicitud no ha sido pagada/completada.");
        }

        return request;
    }

    @Transactional(readOnly = true)
    public PickupRequest getConstanciaForCollector(Long id, Long collectorUserId) {
        PickupRequest request = pickupRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de recojo no encontrada."));

        if (request.getCollectorUserId() == null || !request.getCollectorUserId().equals(collectorUserId)) {
            throw new BusinessException("No tiene permisos para descargar la constancia de esta solicitud.");
        }

        if (request.getStatus() != PickupRequestStatus.COMPLETADO || !"PAGADO".equals(request.getEstadoPago())) {
            throw new BusinessException("La constancia no está disponible porque la solicitud no ha sido pagada/completada.");
        }

        return request;
    }

    @Transactional(readOnly = true)
    public List<PickupRequest> getRequestsForExportCompany(Long companyId, java.time.LocalDate desde, java.time.LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw new BusinessException("La fecha 'desde' no puede ser mayor a 'hasta'.");
        }
        java.time.LocalDateTime startOfDay = desde.atStartOfDay();
        java.time.LocalDateTime endOfDay = hasta.atTime(23, 59, 59, 999999999);
        return pickupRequestRepository.findByCompanyIdAndRequestedAtBetweenOrderByRequestedAtDesc(companyId, startOfDay, endOfDay);
    }

    @Transactional(readOnly = true)
    public List<PickupRequest> getRequestsForExportCollector(Long collectorUserId, java.time.LocalDate desde, java.time.LocalDate hasta) {
        if (desde.isAfter(hasta)) {
            throw new BusinessException("La fecha 'desde' no puede ser mayor a 'hasta'.");
        }
        java.time.LocalDateTime startOfDay = desde.atStartOfDay();
        java.time.LocalDateTime endOfDay = hasta.atTime(23, 59, 59, 999999999);
        return pickupRequestRepository.findByCollectorUserIdAndRequestedAtBetweenOrderByRequestedAtDesc(collectorUserId, startOfDay, endOfDay);
    }

    @Transactional(readOnly = true)
    public User getContactUserForCompany(Long companyId) {
        List<User> users = userRepository.findByCompanyId(companyId);
        if (users != null && !users.isEmpty()) {
            return users.get(0);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestResponse enrichPickupRequestResponse(com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestResponse response, PickupRequest request) {
        if (request.getCollectorUserId() != null) {
            userRepository.findById(request.getCollectorUserId()).ifPresent(user -> {
                Company recolectorCompany = user.getCompany();
                response.setRecolectorAsignado(recolectorCompany.getBusinessName());

                if (request.getTransportUnit() == null) {
                    List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(recolectorCompany.getId());
                    if (!units.isEmpty()) {
                        TransportUnit firstUnit = units.get(0);
                        response.setTransportePlaca(firstUnit.getPlate());
                        response.setTransporteCapacidadLitros(firstUnit.getCapacityLiters());
                        response.setCollectorLatitude(firstUnit.getLastLatitude());
                        response.setCollectorLongitude(firstUnit.getLastLongitude());
                    }
                } else {
                    response.setTransportePlaca(request.getTransportUnit().getPlate());
                    response.setTransporteCapacidadLitros(request.getTransportUnit().getCapacityLiters());
                    response.setCollectorLatitude(request.getTransportUnit().getLastLatitude());
                    response.setCollectorLongitude(request.getTransportUnit().getLastLongitude());
                }
            });
        } else if (request.getTransportUnit() != null) {
            response.setCollectorLatitude(request.getTransportUnit().getLastLatitude());
            response.setCollectorLongitude(request.getTransportUnit().getLastLongitude());
        }

        java.util.List<PickupRequestIncident> incidents = incidentRepository.findByPickupRequestIdOrderByCreatedAtDesc(request.getId());
        if (incidents != null && !incidents.isEmpty()) {
            java.util.List<com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentResponse> dtos = new java.util.ArrayList<>();
            for (PickupRequestIncident inc : incidents) {
                com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentResponse dto = com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentResponse.builder()
                    .id(inc.getId())
                    .pickupRequestId(inc.getPickupRequest().getId())
                    .reasonCode(inc.getReasonCode())
                    .reasonLabel(inc.getReasonLabel())
                    .customReason(inc.getCustomReason())
                    .description(inc.getDescription())
                    .status(inc.getStatus())
                    .createdAt(inc.getCreatedAt())
                    .build();
                if (inc.getReporterUser() != null) {
                    dto.setReporterName((inc.getReporterUser().getFirstName() != null ? inc.getReporterUser().getFirstName() : "") + " " + (inc.getReporterUser().getLastName() != null ? inc.getReporterUser().getLastName() : ""));
                    if (dto.getReporterName().trim().isEmpty()) {
                        dto.setReporterName("Recolector");
                    }
                    dto.setReporterEmail(inc.getReporterUser().getEmail());
                    dto.setReporterRole(inc.getReporterUser().getRole() != null ? inc.getReporterUser().getRole().name() : null);
                }
                dtos.add(dto);
            }
            response.setIncidencias(dtos);
        }

        return response;
    }
}
