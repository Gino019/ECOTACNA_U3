package com.GAKOM_ECOTACNA.ECOTACNA.mapper;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.*;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;

public class ModelMapper {

    public static boolean hasAssignedCollector(PickupRequest request) {
        if (request == null) {
            return false;
        }
        return request.getCollectorUserId() != null || request.getTransportUnit() != null;
    }

    public static AuditLogResponse toAuditLogResponse(AuditLog log) {
        if (log == null) {
            return null;
        }
        return AuditLogResponse.builder()
                .id(log.getId())
                .email(log.getEmail())
                .action(log.getAction())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }

    public static PickupRequestResponse toPickupRequestResponse(PickupRequest request) {
        if (request == null) {
            return null;
        }
        PickupRequestResponse dto = new PickupRequestResponse();
        dto.setId(request.getId());
        dto.setEmpresaId(request.getCompany().getId());
        dto.setEmpresaRazonSocial(request.getCompany().getBusinessName());
        dto.setVolumenAproximado(request.getApproximateVolumeLiters());
        dto.setEstado(request.getStatus().name());
        dto.setFechaSolicitud(request.getRequestedAt());
        dto.setFechaProgramada(request.getScheduledAt());
        
        dto.setVolumenReal(request.getActualVolumeLiters());
        dto.setFechaRecoleccion(request.getCollectedAt());
        dto.setDireccion(request.getDireccion());
        dto.setEvidenciaUrl(request.getEvidenciaUrl());
        dto.setObservaciones(request.getObservaciones());
        dto.setCreatedAt(request.getRequestedAt()); // or requestedAt
        dto.setUpdatedAt(request.getUpdatedAt());
        if (request.getStatus() == com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestStatus.PENDIENTE && request.getRequestedAt() != null) {
            dto.setAvailableUntil(request.getRequestedAt().plusDays(7));
            long secs = java.time.Duration.between(java.time.LocalDateTime.now(java.time.ZoneId.of("America/Lima")), dto.getAvailableUntil()).getSeconds();
            dto.setSegundosRestantes(secs > 0 ? secs : 0);
        }
        
        dto.setPrecioOfertadoPorLitro(request.getPrecioOfertadoPorLitro());
        if (request.getApproximateVolumeLiters() != null && request.getPrecioOfertadoPorLitro() != null) {
            dto.setMontoEstimado(request.getApproximateVolumeLiters().multiply(request.getPrecioOfertadoPorLitro()));
        }
        
        dto.setLitrosConfirmados(request.getLitrosConfirmados());
        dto.setPrecioPorLitro(request.getPrecioPorLitro());
        dto.setMontoTotal(request.getMontoTotal());
        dto.setEstadoPago(request.getEstadoPago());
        dto.setFechaConfirmacionPago(request.getFechaConfirmacionPago());
        dto.setObservacionPago(request.getObservacionPago());
        
        if (request.getTransportUnit() != null) {
            dto.setTransportePlaca(request.getTransportUnit().getPlate());
            dto.setTransportUnitId(request.getTransportUnit().getId());
        }
        if (request.getCollectorUserId() != null) {
            dto.setRecolectorAsignado(request.getCollectorUserId().toString());
            dto.setCollectorUserId(request.getCollectorUserId());
        }
        dto.setHasAssignedCollector(ModelMapper.hasAssignedCollector(request));
        
        dto.setPickupLatitude(request.getPickupLatitude());
        dto.setPickupLongitude(request.getPickupLongitude());
        if (request.getCompany() != null) {
            dto.setCompanyLatitude(request.getCompany().getLatitude());
            dto.setCompanyLongitude(request.getCompany().getLongitude());
        }
        
        return dto;
    }

    public static TransportUnitResponse toTransportUnitResponse(TransportUnit unit) {
        if (unit == null) {
            return null;
        }
        TransportUnitResponse dto = new TransportUnitResponse();
        dto.setId(unit.getId());
        dto.setEmpresaRecolectoraId(unit.getCollectorCompany().getId());
        dto.setEmpresaRazonSocial(unit.getCollectorCompany().getBusinessName());
        dto.setPlaca(unit.getPlate());
        dto.setMarca(unit.getBrand());
        dto.setModelo(unit.getModel());
        dto.setCapacidadLitros(unit.getCapacityLiters());
        dto.setTipoUnidad(unit.getUnitType());
        dto.setEstado(unit.getStatus().name());
        dto.setObservaciones(unit.getObservations());
        dto.setCreatedAt(unit.getCreatedAt());
        dto.setUpdatedAt(unit.getUpdatedAt());
        return dto;
    }
}
