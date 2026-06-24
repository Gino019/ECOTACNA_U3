package com.ecotacna.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecojoRecommendationItem {
    private Long pickupRequestId;
    private Integer aiRank;
    private BigDecimal aiScore;
    private Boolean aiRecommended;
    private String label;
    private String reason;
    private List<String> tags;
}
