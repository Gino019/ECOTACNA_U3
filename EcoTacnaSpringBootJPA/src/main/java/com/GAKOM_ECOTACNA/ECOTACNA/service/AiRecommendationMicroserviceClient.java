package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AiPickupRecommendationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiRecommendationMicroserviceClient {

    @Value("${ai.recommendation.service.url:http://localhost:8091}")
    private String serviceUrl;

    @Value("${ai.recommendation.service.token:}")
    private String serviceToken;

    private final RestTemplate restTemplate;

    public AiRecommendationMicroserviceClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000); // Timeout defined in plan
        this.restTemplate = new RestTemplate(factory);
    }

    public AiPickupRecommendationResponse getRecommendationsFromMicroservice(Map<String, Object> requestBody) {
        try {
            String url = serviceUrl + "/api/ia/recojos/recomendar";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (serviceToken != null && !serviceToken.isBlank()) {
                headers.set("X-EcoTacna-Internal-Token", serviceToken);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<AiPickupRecommendationResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, AiPickupRecommendationResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return null;
        } catch (Exception e) {
            System.err.println("Failed to call AI microservice: " + e.getMessage());
            return null;
        }
    }
}
