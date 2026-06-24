package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class SubscriptionResponse {
    private Long id;
    private Long planId;
    private String planName;
    private SubscriptionStatus status;
    private LocalDate startDate;
    private LocalDate trialEndsAt;
    private LocalDate nextBillingDate;
}
