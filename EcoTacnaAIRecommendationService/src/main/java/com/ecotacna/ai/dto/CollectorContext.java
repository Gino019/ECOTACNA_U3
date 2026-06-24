package com.ecotacna.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectorContext {
    private Long collectorCompanyId;
    private BigDecimal collectorLatitude;
    private BigDecimal collectorLongitude;
    private BigDecimal capacityLiters;
    private String activeUnitPlate;
}
