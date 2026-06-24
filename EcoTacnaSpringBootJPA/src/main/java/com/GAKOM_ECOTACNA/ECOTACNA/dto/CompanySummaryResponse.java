package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompanySummaryResponse {
    private Long empresaId;
    private String razonSocial;
    private long totalSolicitudes;
    private BigDecimal totalLitrosReciclados;
    private long solicitudesPendientes;
    private long solicitudesCompletadas;
}
