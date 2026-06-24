package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PickupRequestResponse {
    private Long id;
    private Long empresaId;
    private String empresaRazonSocial;
    private String empresaRuc;
    private String contactoNombre;
    private String contactoTelefono;
    private String contactoCorreo;
    private BigDecimal volumenAproximado;
    private BigDecimal volumenReal;
    private String estado;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaRecoleccion;
    private String transportePlaca;
    private BigDecimal transporteCapacidadLitros;
    private String recolectorAsignado;
    private String direccion;
    private String evidenciaUrl;
    private String observaciones;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime availableUntil;

    private BigDecimal precioOfertadoPorLitro;
    private BigDecimal montoEstimado;

    private BigDecimal litrosConfirmados;
    private BigDecimal precioPorLitro;
    private BigDecimal montoTotal;
    private String estadoPago;
    private LocalDateTime fechaConfirmacionPago;
    private String observacionPago;

    private BigDecimal pickupLatitude;
    private BigDecimal pickupLongitude;
    private BigDecimal companyLatitude;
    private BigDecimal companyLongitude;
    private BigDecimal collectorLatitude;
    private BigDecimal collectorLongitude;
    private Long segundosRestantes;
    private Double distanceKm;
    
    private java.util.List<PickupRequestIncidentResponse> incidencias;

    // Campos de IA / Recomendación
    private Boolean aiRecommended;
    private Integer aiRank;
    private BigDecimal aiScore;
    private String aiReason;
    private java.util.List<String> aiTags;
    private String recommendationSource;
}
