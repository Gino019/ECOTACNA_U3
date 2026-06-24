package com.ecotacna.ai.service;

import com.ecotacna.ai.dto.AiRecojoRecommendationResponse;
import com.ecotacna.ai.dto.AiRecojoRecommendationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAiClient {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String geminiApiUrl;

    @Value("${gemini.recommendations.enabled:false}")
    private boolean recommendationsEnabled;

    @Value("${gemini.timeout.seconds:5}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public GeminiAiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isEnabled() {
        return recommendationsEnabled && geminiApiKey != null && !geminiApiKey.isBlank();
    }

    public AiRecojoRecommendationResponse getRecommendations(AiRecojoRecommendationRequest request) {
        if (!isEnabled() || request.getRequests().isEmpty()) {
            return null;
        }

        try {
            String url = geminiApiUrl + geminiModel + ":generateContent?key=" + geminiApiKey;

            String prompt = "Eres un asistente de logística para EcoTacna.\n" +
                    "Debes ordenar solicitudes de recojo para un recolector basándote estrictamente en las métricas proporcionadas.\n" +
                    "Devuelve la respuesta en formato JSON estrictamente, sin markdown.\n" +
                    "El campo bestOptionId debe pertenecer a una solicitud con exceedsCapacity=false.\n" +
                    "La estructura JSON requerida es:\n" +
                    "{\n" +
                    "  \"bestOptionId\": ID_NUMERICO,\n" +
                    "  \"orderedRequestIds\": [ID1, ID2, ...],\n" +
                    "  \"recommendations\": [\n" +
                    "    {\n" +
                    "      \"pickupRequestId\": ID_NUMERICO,\n" +
                    "      \"aiScore\": SCORE_DE_0_A_100,\n" +
                    "      \"label\": \"Ej: Mejor opción\",\n" +
                    "      \"reason\": \"Ej: Buena distancia y buen ingreso.\",\n" +
                    "      \"tags\": [\"Cercano\", \"Compatible\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}\n\n" +
                    "Datos de entrada:\n" +
                    objectMapper.writeValueAsString(request);

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Parse Gemini response
                Map<String, Object> responseMap = objectMapper.readValue(response.getBody(), Map.class);
                if (responseMap.containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                    if (!candidates.isEmpty()) {
                        Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                        if (contentMap != null && contentMap.containsKey("parts")) {
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                            if (!parts.isEmpty()) {
                                String jsonText = (String) parts.get(0).get("text");
                                return objectMapper.readValue(jsonText, AiRecojoRecommendationResponse.class);
                            }
                        }
                    }
                }
            }
            System.err.println("Gemini recommendation failed: Invalid response format");
            return null;
        } catch (Exception e) {
            System.err.println("Gemini recommendation failed: " + e.getMessage());
            return null;
        }
    }
}
