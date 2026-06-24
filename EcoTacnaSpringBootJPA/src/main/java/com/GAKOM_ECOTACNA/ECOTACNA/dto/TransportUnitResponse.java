package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransportUnitResponse {
    private Long id;
    private Long empresaRecolectoraId;
    private String empresaRazonSocial;
    private String placa;
    private String marca;
    private String modelo;
    private BigDecimal capacidadLitros;
    private String tipoUnidad;
    private String estado;
    private String observaciones;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
