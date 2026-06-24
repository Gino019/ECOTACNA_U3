package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubscriptionStartRequest {
    @NotNull
    private Long planId;
}
