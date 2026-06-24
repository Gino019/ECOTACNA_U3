package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class SubscriptionStatusResponse {
    private String companyName;
    private CompanyType companyType;
    private SubscriptionStatus status;
    private String planName;
    private BigDecimal monthlyAmount;
    private String currency;
    private LocalDate trialEndsAt;
    private LocalDate currentPeriodEnd;
    private Boolean canOperate;
    private String message;
}
