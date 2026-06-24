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
public class AiRecojoRecommendationRequest {
    private CollectorContext collector;
    private List<RecojoCandidateRequest> requests;
}
