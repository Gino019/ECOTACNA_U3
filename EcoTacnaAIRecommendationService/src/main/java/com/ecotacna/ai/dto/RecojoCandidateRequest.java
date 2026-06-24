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
public class RecojoCandidateRequest {
    private Long pickupRequestId;
    private String restaurantName;
    private BigDecimal estimatedLiters;
    private BigDecimal distanceKm;
    private BigDecimal pricePerLiter;
    private BigDecimal estimatedRevenue;
    private Long remainingMinutes;
    private Boolean exceedsCapacity;
    private BigDecimal capacityUsagePercent;
    private Boolean hasValidCoordinates;
    private BigDecimal baseScore;
}
