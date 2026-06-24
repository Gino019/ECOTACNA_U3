package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestIncident;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PickupRequestIncidentRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PickupRequestRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PickupRequestIncidentService {

    private final PickupRequestIncidentRepository incidentRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public PickupRequestIncidentResponse reportIncident(Long requestId, PickupRequestIncidentRequest requestDto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        PickupRequest pickupRequest = pickupRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + requestId));

        // Validación de pertenencia
        if (pickupRequest.getCompany() == null || !pickupRequest.getCompany().getId().equals(user.getCompany().getId())) {
            throw new BusinessException("No tienes permisos para reportar incidencias en esta solicitud");
        }

        // Bloquear doble incidencia
        if (incidentRepository.existsByPickupRequestId(requestId)) {
            throw new BusinessException("Esta solicitud ya tiene una incidencia reportada.");
        }

        // Validación de estado de la solicitud o si tiene asignación
        PickupRequestStatus status = pickupRequest.getStatus();
        boolean hasAssignedCollector = com.GAKOM_ECOTACNA.ECOTACNA.mapper.ModelMapper.hasAssignedCollector(pickupRequest);
        if (status != PickupRequestStatus.EN_RUTA && 
            status != PickupRequestStatus.COMPLETADO && 
            status != PickupRequestStatus.CANCELADO && 
            status != PickupRequestStatus.PROGRAMADO &&
            status != PickupRequestStatus.EN_SITIO &&
            !(status == PickupRequestStatus.PENDIENTE && hasAssignedCollector)) {
            throw new BusinessException("No se pueden reportar incidencias para solicitudes en estado " + status.name());
        }

        // Validación del DTO
        if (("OTROS".equals(requestDto.getReasonCode()) || "OTRO".equals(requestDto.getReasonCode())) && 
            (requestDto.getCustomReason() == null || requestDto.getCustomReason().trim().isEmpty())) {
            throw new BusinessException("El motivo personalizado es obligatorio cuando se selecciona 'Otros'");
        }

        String label = getLabelFromCode(requestDto.getReasonCode());

        PickupRequestIncident incident = PickupRequestIncident.builder()
                .pickupRequest(pickupRequest)
                .reporterCompany(user.getCompany())
                .reporterUser(user)
                .reasonCode(requestDto.getReasonCode())
                .reasonLabel(label)
                .customReason(requestDto.getCustomReason())
                .description(requestDto.getDescription())
                .build();

        PickupRequestIncident savedIncident = incidentRepository.save(incident);

        // Cambiar la solicitud a estado final rojo para liberar al recolector
        pickupRequest.setStatus(PickupRequestStatus.CANCELADO);
        pickupRequest.setEstadoPago("NO_APLICA");
        
        // Agregar el motivo de la incidencia a las observaciones para el recolector
        String nuevaObservacion = "Incidencia reportada por restaurante | Motivo: " + 
            (("OTROS".equals(requestDto.getReasonCode()) || "OTRO".equals(requestDto.getReasonCode())) ? requestDto.getCustomReason() : label) + 
            (requestDto.getDescription() != null && !requestDto.getDescription().isBlank() ? " | Descripción: " + requestDto.getDescription() : "");
            
        if (pickupRequest.getObservaciones() == null || pickupRequest.getObservaciones().isEmpty()) {
            pickupRequest.setObservaciones(nuevaObservacion);
        } else {
            pickupRequest.setObservaciones(pickupRequest.getObservaciones() + " || " + nuevaObservacion);
        }
        
        pickupRequestRepository.save(pickupRequest);

        return mapToResponse(savedIncident);
    }

    @Transactional(readOnly = true)
    public List<PickupRequestIncidentResponse> getIncidentsByRequestId(Long requestId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        PickupRequest pickupRequest = pickupRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Solicitud no encontrada con ID: " + requestId));

        boolean isGeneratorOwner = pickupRequest.getCompany() != null && 
                                    user.getCompany() != null && 
                                    java.util.Objects.equals(pickupRequest.getCompany().getId(), user.getCompany().getId());

        boolean isAssignedCollectorUser = pickupRequest.getCollectorUserId() != null && 
                                          java.util.Objects.equals(pickupRequest.getCollectorUserId(), user.getId());

        boolean isAssignedCollectorCompany = false;
        if (user.getCompany() != null) {
            if (pickupRequest.getTransportUnit() != null && 
                pickupRequest.getTransportUnit().getCollectorCompany() != null && 
                java.util.Objects.equals(pickupRequest.getTransportUnit().getCollectorCompany().getId(), user.getCompany().getId())) {
                isAssignedCollectorCompany = true;
            }
            if (!isAssignedCollectorCompany && pickupRequest.getCollectorUserId() != null) {
                User assignedCollector = userRepository.findById(pickupRequest.getCollectorUserId()).orElse(null);
                if (assignedCollector != null && assignedCollector.getCompany() != null && 
                    java.util.Objects.equals(assignedCollector.getCompany().getId(), user.getCompany().getId())) {
                    isAssignedCollectorCompany = true;
                }
            }
        }

        boolean isAdmin = user.getRole() == com.GAKOM_ECOTACNA.ECOTACNA.model.Role.ADMIN;

        if (!isGeneratorOwner && !isAssignedCollectorUser && !isAssignedCollectorCompany && !isAdmin) {
            throw new BusinessException("No tienes permisos para ver incidencias en esta solicitud");
        }

        return incidentRepository.findByPickupRequestIdOrderByCreatedAtDesc(requestId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String getLabelFromCode(String code) {
        return switch (code) {
            case "RECOLECTOR_NO_LLEGO" -> "El recolector no llegó";
            case "RECOLECTOR_LLEGO_TARDE" -> "El recolector llegó tarde";
            case "RECOLECTOR_NO_ACEPTO_CONDICIONES" -> "El recolector no aceptó las condiciones acordadas";
            case "RECOLECTOR_NO_TENIA_CAPACIDAD" -> "El recolector no tenía capacidad suficiente";
            case "RECOLECTOR_NO_TRAJO_UNIDAD_ADECUADA" -> "El recolector no trajo una unidad adecuada";
            case "NO_SE_CONCRETO_RECOJO" -> "No se concretó el recojo";
            case "ERROR_EN_DATOS_SOLICITUD" -> "Error en los datos de la solicitud";
            case "OTROS", "OTRO" -> "Otro motivo";
            case "CANTIDAD_NO_COINCIDE" -> "La cantidad registrada no coincide";
            case "NO_RECIBI_PAGO" -> "No recibí el pago acordado";
            case "RECOJO_INCOMPLETO" -> "El recojo fue incompleto";
            case "MALA_CONDUCTA" -> "Mala conducta o trato inadecuado";
            case "PROBLEMA_HORARIO" -> "Problema con el horario acordado";
            default -> code != null ? code.replace("_", " ") : "Motivo desconocido";
        };
    }

    private PickupRequestIncidentResponse mapToResponse(PickupRequestIncident incident) {
        PickupRequestIncidentResponse.PickupRequestIncidentResponseBuilder builder = PickupRequestIncidentResponse.builder()
                .id(incident.getId())
                .pickupRequestId(incident.getPickupRequest().getId())
                .reasonCode(incident.getReasonCode())
                .reasonLabel(incident.getReasonLabel())
                .customReason(incident.getCustomReason())
                .description(incident.getDescription())
                .status(incident.getStatus())
                .createdAt(incident.getCreatedAt());

        if (incident.getReporterUser() != null) {
            String name = ((incident.getReporterUser().getFirstName() != null ? incident.getReporterUser().getFirstName() : "") + " " +
                          (incident.getReporterUser().getLastName() != null ? incident.getReporterUser().getLastName() : "")).trim();
            if (name.isEmpty()) {
                name = "Usuario";
            }
            builder.reporterName(name)
                   .reporterEmail(incident.getReporterUser().getEmail())
                   .reporterRole(incident.getReporterUser().getRole() != null ? incident.getReporterUser().getRole().name() : null);
        }

        return builder.build();
    }
}
