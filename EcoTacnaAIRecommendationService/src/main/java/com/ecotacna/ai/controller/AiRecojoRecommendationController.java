package com.ecotacna.ai.controller;

import com.ecotacna.ai.dto.AiRecojoRecommendationRequest;
import com.ecotacna.ai.dto.AiRecojoRecommendationResponse;
import com.ecotacna.ai.service.GeminiAiClient;
import com.ecotacna.ai.service.RecommendationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ia")
public class AiRecojoRecommendationController {

    private final RecommendationService recommendationService;
    private final GeminiAiClient geminiAiClient;

    @Value("${internal.ai.service.token:}")
    private String internalToken;

    public AiRecojoRecommendationController(RecommendationService recommendationService, GeminiAiClient geminiAiClient) {
        this.recommendationService = recommendationService;
        this.geminiAiClient = geminiAiClient;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "EcoTacnaAIRecommendationService");
        response.put("geminiEnabled", geminiAiClient.isEnabled());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recojos/recomendar")
    public ResponseEntity<?> recommend(
            @RequestHeader(value = "X-EcoTacna-Internal-Token", required = false) String token,
            @RequestBody AiRecojoRecommendationRequest request) {

        if (internalToken != null && !internalToken.isBlank() && !internalToken.equals("default_internal_token_override_me")) {
            if (token == null || !token.equals(internalToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid internal token");
            }
        }

        AiRecojoRecommendationResponse response = recommendationService.recommend(request);
        return ResponseEntity.ok(response);
    }
}
