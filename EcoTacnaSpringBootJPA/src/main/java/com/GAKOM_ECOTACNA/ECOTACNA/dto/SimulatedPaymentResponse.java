package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class SimulatedPaymentResponse {
    private boolean success;
    private Long companyId;
    private String companyName;
    private String companyType;
    private String planName;
    private String subscriptionStatus;
    private BigDecimal todayAmount;
    private BigDecimal monthlyAmount;
    private Integer trialDays;
    private String providerTokenId;
    private String providerChargeId;
    private String message;
}
