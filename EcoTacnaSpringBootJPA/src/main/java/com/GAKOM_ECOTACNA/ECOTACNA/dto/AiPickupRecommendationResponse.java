package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPickupRecommendationResponse {
    private Long bestOptionId;
    private String source;
    private List<Long> orderedRequestIds;
    private List<AiPickupRecommendationItem> recommendations;
}
