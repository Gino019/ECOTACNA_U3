package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PlanResponse {
    private Long id;
    private String code;
    private String name;
    private String companyType;
    private BigDecimal monthlyAmount;
    private String currency;
    private Integer trialDays;
}
