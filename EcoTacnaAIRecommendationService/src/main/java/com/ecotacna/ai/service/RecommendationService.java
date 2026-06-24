package com.ecotacna.ai.service;

import com.ecotacna.ai.dto.AiRecojoRecommendationItem;
import com.ecotacna.ai.dto.AiRecojoRecommendationRequest;
import com.ecotacna.ai.dto.AiRecojoRecommendationResponse;
import com.ecotacna.ai.dto.RecojoCandidateRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final RecojoBaseScoringService baseScoringService;
    private final GeminiAiClient geminiAiClient;

    public RecommendationService(RecojoBaseScoringService baseScoringService, GeminiAiClient geminiAiClient) {
        this.baseScoringService = baseScoringService;
        this.geminiAiClient = geminiAiClient;
    }

    public AiRecojoRecommendationResponse recommend(AiRecojoRecommendationRequest request) {
        if (request == null || request.getRequests() == null || request.getRequests().isEmpty()) {
            return AiRecojoRecommendationResponse.builder()
                    .source("OFF")
                    .orderedRequestIds(new ArrayList<>())
                    .recommendations(new ArrayList<>())
                    .fallbackReason("No requests provided")
                    .build();
        }

        // Siempre calculamos el score base como primer paso
        baseScoringService.sortCandidates(request.getRequests());

        // Intentar Gemini si está habilitado
        if (geminiAiClient.isEnabled()) {
            AiRecojoRecommendationResponse geminiResponse = geminiAiClient.getRecommendations(request);
            if (geminiResponse != null && validateGeminiResponse(geminiResponse, request.getRequests())) {
                geminiResponse.setSource("GEMINI");
                return geminiResponse;
            }
        }

        // Fallback a Base Score
        return generateBaseScoreResponse(request.getRequests());
    }

    private boolean validateGeminiResponse(AiRecojoRecommendationResponse response, List<RecojoCandidateRequest> requests) {
        if (response.getBestOptionId() == null || response.getOrderedRequestIds() == null || response.getOrderedRequestIds().isEmpty()) {
            return false;
        }

        // Validar que bestOptionId no excede capacidad
        RecojoCandidateRequest bestOption = requests.stream()
                .filter(r -> r.getPickupRequestId().equals(response.getBestOptionId()))
                .findFirst()
                .orElse(null);

        if (bestOption == null) return false;
        if (bestOption.getExceedsCapacity() != null && bestOption.getExceedsCapacity()) return false;

        return true;
    }

    private AiRecojoRecommendationResponse generateBaseScoreResponse(List<RecojoCandidateRequest> sortedRequests) {
        AiRecojoRecommendationResponse response = new AiRecojoRecommendationResponse();
        response.setSource("BASE_SCORE");
        response.setFallbackReason("Gemini disabled or failed. Used base score.");

        List<Long> orderedIds = sortedRequests.stream().map(RecojoCandidateRequest::getPickupRequestId).collect(Collectors.toList());
        response.setOrderedRequestIds(orderedIds);

        List<AiRecojoRecommendationItem> items = new ArrayList<>();
        int rank = 1;
        for (RecojoCandidateRequest req : sortedRequests) {
            AiRecojoRecommendationItem item = new AiRecojoRecommendationItem();
            item.setPickupRequestId(req.getPickupRequestId());
            item.setAiRank(rank);
            item.setAiScore(req.getBaseScore());
            
            if (rank == 1 && (req.getExceedsCapacity() == null || !req.getExceedsCapacity())) {
                item.setAiRecommended(true);
                item.setLabel("Mejor opción (Calculada)");
                item.setReason("Basado en métricas de sistema (distancia, ingresos y urgencia).");
                response.setBestOptionId(req.getPickupRequestId());
            } else {
                item.setAiRecommended(false);
            }
            items.add(item);
            rank++;
        }

        response.setRecommendations(items);
        return response;
    }
}
