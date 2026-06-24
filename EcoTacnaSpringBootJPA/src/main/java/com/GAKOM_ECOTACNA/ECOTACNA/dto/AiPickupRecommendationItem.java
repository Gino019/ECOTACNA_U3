package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPickupRecommendationItem {
    private Long pickupRequestId;
    private BigDecimal aiScore;
    private Boolean aiRecommended;
    private String label;
    private String reason;
    private List<String> tags;
}
