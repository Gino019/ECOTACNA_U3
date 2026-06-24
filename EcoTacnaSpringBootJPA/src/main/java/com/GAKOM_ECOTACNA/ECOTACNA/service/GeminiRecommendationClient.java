package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AiPickupRecommendationResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRecommendationMetrics;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class GeminiRecommendationClient {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${gemini.recommendations.enabled:false}")
    private boolean recommendationsEnabled;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public GeminiRecommendationClient() {
        this.objectMapper = new ObjectMapper();
        // Configure short timeout (5 seconds)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isEnabled() {
        return recommendationsEnabled && geminiApiKey != null && !geminiApiKey.isBlank();
    }

    public AiPickupRecommendationResponse getRecommendations(Map<String, Object> collectorInfo, List<PickupRecommendationMetrics> metricsList) {
        if (!isEnabled() || metricsList.isEmpty()) {
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            Map<String, Object> inputData = new HashMap<>();
            inputData.put("collector", collectorInfo);
            inputData.put("requests", metricsList);

            String prompt = "Eres un asistente de logística para EcoTacna.\n" +
                    "Debes ordenar solicitudes de recojo para un recolector basándote estrictamente en las métricas proporcionadas.\n" +
                    "Devuelve la respuesta en formato JSON estrictamente, sin markdown.\n" +
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
                    objectMapper.writeValueAsString(inputData);

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
                                return objectMapper.readValue(jsonText, AiPickupRecommendationResponse.class);
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
