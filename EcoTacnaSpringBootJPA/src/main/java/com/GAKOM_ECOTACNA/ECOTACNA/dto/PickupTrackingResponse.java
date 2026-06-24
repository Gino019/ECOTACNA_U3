package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PickupTrackingResponse {
    private Long solicitudId;
    private String estado;
    private String empresaGeneradora;
    private String direccion;
    private BigDecimal volumenAproximado;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaProgramada;
    private String observaciones;
    private RecolectorInfo recolector;
    private UnidadInfo unidad;

    private BigDecimal litrosConfirmados;
    private BigDecimal precioOfertadoPorLitro;
    private BigDecimal montoEstimado;
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

    @Data
    @Builder
    public static class RecolectorInfo {
        private Long empresaRecolectoraId;
        private String razonSocial;
        private String ruc;
        private String correo;
        private String telefono;
    }

    @Data
    @Builder
    public static class UnidadInfo {
        private String placa;
        private String marca;
        private String modelo;
        private String tipoUnidad;
        private BigDecimal capacidadLitros;
    }
}
