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

        // Validación de estado de la solicitud
        PickupRequestStatus status = pickupRequest.getStatus();
        if (status != PickupRequestStatus.EN_RUTA && 
            status != PickupRequestStatus.COMPLETADO && 
            status != PickupRequestStatus.CANCELADO && 
            status != PickupRequestStatus.PROGRAMADO &&
            status != PickupRequestStatus.EN_SITIO) {
            throw new BusinessException("No se pueden reportar incidencias para solicitudes en estado " + status.name());
        }

        // Validación del DTO
        if ("OTROS".equals(requestDto.getReasonCode()) && (requestDto.getCustomReason() == null || requestDto.getCustomReason().trim().isEmpty())) {
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
        
        // Agregar el motivo de la incidencia a las observaciones para el recolector
        String nuevaObservacion = "Incidencia reportada por restaurante | Motivo: " + 
            (requestDto.getReasonCode().equals("OTROS") ? requestDto.getCustomReason() : label) + 
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

        if (pickupRequest.getCompany() == null || !pickupRequest.getCompany().getId().equals(user.getCompany().getId())) {
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
            case "CANTIDAD_NO_COINCIDE" -> "La cantidad registrada no coincide";
            case "NO_RECIBI_PAGO" -> "No recibí el pago acordado";
            case "RECOJO_INCOMPLETO" -> "El recojo fue incompleto";
            case "MALA_CONDUCTA" -> "Mala conducta o trato inadecuado";
            case "PROBLEMA_HORARIO" -> "Problema con el horario acordado";
            case "OTROS" -> "Otros";
            default -> "Motivo desconocido";
        };
    }

    private PickupRequestIncidentResponse mapToResponse(PickupRequestIncident incident) {
        return PickupRequestIncidentResponse.builder()
                .id(incident.getId())
                .pickupRequestId(incident.getPickupRequest().getId())
                .reasonCode(incident.getReasonCode())
                .reasonLabel(incident.getReasonLabel())
                .customReason(incident.getCustomReason())
                .description(incident.getDescription())
                .status(incident.getStatus())
                .createdAt(incident.getCreatedAt())
                .build();
    }
}
