package com.ecotacna.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecojoRecommendationResponse {
    private Long bestOptionId;
    private String source;
    private List<Long> orderedRequestIds;
    private List<AiRecojoRecommendationItem> recommendations;
    private String fallbackReason;
}
