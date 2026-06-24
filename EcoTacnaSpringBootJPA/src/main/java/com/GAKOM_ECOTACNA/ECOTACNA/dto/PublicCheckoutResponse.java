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
public class PublicCheckoutResponse {
    private Long companyId;
    private String companyName;
    private String companyType;
    private Long planId;
    private String planCode;
    private String planName;
    private BigDecimal monthlyAmount;
    private String currency;
    private Integer trialDays;
    private BigDecimal todayAmount;
    private String status;
}
