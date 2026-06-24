package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubscriptionRequest {
    @NotNull(message = "subscriptionStatus es obligatorio")
    private SubscriptionStatus subscriptionStatus;
}
