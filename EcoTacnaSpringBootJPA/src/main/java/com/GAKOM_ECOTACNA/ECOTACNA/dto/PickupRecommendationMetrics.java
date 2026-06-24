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
public class PickupRecommendationMetrics {
    private Long pickupRequestId;
    private String restaurantName;
    private BigDecimal estimatedLiters;
    private BigDecimal collectorCapacityLiters;
    private BigDecimal capacityUsagePercent;
    private Boolean exceedsCapacity;
    private BigDecimal distanceKm;
    private BigDecimal pricePerLiter;
    private BigDecimal estimatedRevenue;
    private BigDecimal estimatedProfitabilityScore;
    private Long remainingMinutes;
    private Boolean hasValidCoordinates;
    private String pickupAddress;
    private BigDecimal baseScore;
}
