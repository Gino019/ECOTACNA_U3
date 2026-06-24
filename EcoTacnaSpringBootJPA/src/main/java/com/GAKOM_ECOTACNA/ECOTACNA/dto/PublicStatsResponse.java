package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsResponse {
    private BigDecimal litrosRecolectados;
    private long empresasActivas;
    private long recolectoresActivos;
    private BigDecimal pagosProcesados;
}
