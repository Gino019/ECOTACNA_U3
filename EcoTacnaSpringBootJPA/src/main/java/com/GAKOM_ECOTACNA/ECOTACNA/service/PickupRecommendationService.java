package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AiPickupRecommendationItem;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.AiPickupRecommendationResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRecommendationMetrics;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportUnit;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.TransportUnitRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PickupRecommendationService {

    private final PickupRecommendationScoringService scoringService;
    private final GeminiRecommendationClient geminiClient;
    private final AiRecommendationMicroserviceClient microserviceClient;
    private final TransportUnitRepository transportUnitRepository;

    @Value("${ai.recommendation.mode:INTERNAL}")
    private String aiRecommendationMode;

    public PickupRecommendationService(PickupRecommendationScoringService scoringService,
                                       GeminiRecommendationClient geminiClient,
                                       AiRecommendationMicroserviceClient microserviceClient,
                                       TransportUnitRepository transportUnitRepository) {
        this.scoringService = scoringService;
        this.geminiClient = geminiClient;
        this.microserviceClient = microserviceClient;
        this.transportUnitRepository = transportUnitRepository;
    }

    public List<PickupRequestResponse> recommendAndSort(List<PickupRequestResponse> requests, Company collectorCompany) {
        if (requests == null || requests.isEmpty() || "OFF".equalsIgnoreCase(aiRecommendationMode)) {
            // Si está OFF, simplemente devuelve la lista tal cual
            if (requests != null && !requests.isEmpty()) {
                int rank = 1;
                for (PickupRequestResponse req : requests) {
                    req.setAiRank(rank++);
                    req.setRecommendationSource("NONE");
                }
            }
            return requests;
        }

        // Get active transport unit capacity
        BigDecimal capacityLiters = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(collectorCompany.getId()).stream()
                .filter(u -> com.GAKOM_ECOTACNA.ECOTACNA.model.TransportStatus.ACTIVO.equals(u.getStatus()))
                .map(TransportUnit::getCapacityLiters)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        List<PickupRecommendationMetrics> metricsList = new ArrayList<>();

        for (PickupRequestResponse req : requests) {
            PickupRecommendationMetrics metrics = new PickupRecommendationMetrics();
            metrics.setPickupRequestId(req.getId());
            metrics.setRestaurantName(req.getEmpresaRazonSocial());
            metrics.setEstimatedLiters(req.getVolumenAproximado());
            metrics.setCollectorCapacityLiters(capacityLiters);

            // Capacity usage
            boolean exceeds = false;
            BigDecimal usage = BigDecimal.ZERO;
            if (capacityLiters.compareTo(BigDecimal.ZERO) > 0 && req.getVolumenAproximado() != null) {
                if (req.getVolumenAproximado().compareTo(capacityLiters) > 0) {
                    exceeds = true;
                }
                usage = req.getVolumenAproximado().divide(capacityLiters, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            } else if (req.getVolumenAproximado() != null && req.getVolumenAproximado().compareTo(BigDecimal.ZERO) > 0) {
                exceeds = true; // Has volume but collector has 0 capacity
            }
            metrics.setExceedsCapacity(exceeds);
            metrics.setCapacityUsagePercent(usage);

            if (req.getDistanceKm() != null) {
                metrics.setDistanceKm(BigDecimal.valueOf(req.getDistanceKm()));
            }

            // Estimated Revenue
            BigDecimal price = req.getPrecioOfertadoPorLitro() != null ? req.getPrecioOfertadoPorLitro() : req.getPrecioPorLitro();
            if (price == null) price = new BigDecimal("2.50"); // fallback referencial
            if (req.getVolumenAproximado() != null) {
                metrics.setEstimatedRevenue(req.getVolumenAproximado().multiply(price));
            }

            if (req.getAvailableUntil() != null) {
                long minutes = ChronoUnit.MINUTES.between(LocalDateTime.now(), req.getAvailableUntil());
                metrics.setRemainingMinutes(minutes > 0 ? minutes : 0);
            }

            metrics.setHasValidCoordinates(req.getPickupLatitude() != null && req.getPickupLongitude() != null);
            metrics.setPickupAddress(req.getDireccion());
            metrics.setPricePerLiter(price);

            // Base score for fallback
            BigDecimal baseScore = scoringService.calculateBaseScore(metrics);
            metrics.setBaseScore(baseScore);
            req.setAiScore(baseScore);

            metricsList.add(metrics);
        }

        AiPickupRecommendationResponse response = null;

        if ("MICROSERVICE".equalsIgnoreCase(aiRecommendationMode)) {
            // Llama al microservicio
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> collectorInfo = new HashMap<>();
            collectorInfo.put("collectorCompanyId", collectorCompany.getId());
            collectorInfo.put("capacityLiters", capacityLiters);
            if (collectorCompany.getLatitude() != null) {
                collectorInfo.put("collectorLatitude", collectorCompany.getLatitude());
                collectorInfo.put("collectorLongitude", collectorCompany.getLongitude());
            }
            requestBody.put("collector", collectorInfo);
            requestBody.put("requests", metricsList);

            response = microserviceClient.getRecommendationsFromMicroservice(requestBody);
        } else if ("INTERNAL".equalsIgnoreCase(aiRecommendationMode)) {
            // Try Gemini interno
            if (geminiClient.isEnabled()) {
                Map<String, Object> collectorInfo = new HashMap<>();
                collectorInfo.put("companyId", collectorCompany.getId());
                collectorInfo.put("capacityLiters", capacityLiters);
                if (collectorCompany.getLatitude() != null) {
                    collectorInfo.put("currentLatitude", collectorCompany.getLatitude());
                    collectorInfo.put("currentLongitude", collectorCompany.getLongitude());
                }
                response = geminiClient.getRecommendations(collectorInfo, metricsList);
            }
        }

        Map<Long, PickupRequestResponse> requestMap = requests.stream()
                .collect(Collectors.toMap(PickupRequestResponse::getId, r -> r));

        List<PickupRequestResponse> sortedList = new ArrayList<>();

        if (response != null && response.getOrderedRequestIds() != null && !response.getOrderedRequestIds().isEmpty()) {
            // Apply ordering
            for (Long reqId : response.getOrderedRequestIds()) {
                if (requestMap.containsKey(reqId)) {
                    sortedList.add(requestMap.get(reqId));
                    requestMap.remove(reqId);
                }
            }
            // Add any remaining that were missed
            sortedList.addAll(requestMap.values());

            // Apply tags and reasons
            if (response.getRecommendations() != null) {
                for (AiPickupRecommendationItem rec : response.getRecommendations()) {
                    for (PickupRequestResponse req : sortedList) {
                        if (req.getId().equals(rec.getPickupRequestId())) {
                            req.setAiScore(rec.getAiScore());
                            if (rec.getReason() != null) req.setAiReason(rec.getReason());
                            if (rec.getTags() != null) req.setAiTags(rec.getTags());
                            if (rec.getAiRecommended() != null) req.setAiRecommended(rec.getAiRecommended());
                            break;
                        }
                    }
                }
            }

            if (!sortedList.isEmpty()) {
                PickupRequestResponse best = sortedList.get(0);
                // Asegurarse de que el mejor no exceda capacidad
                boolean exceeds = false;
                if (capacityLiters.compareTo(BigDecimal.ZERO) > 0 && best.getVolumenAproximado() != null && best.getVolumenAproximado().compareTo(capacityLiters) > 0) {
                    exceeds = true;
                }
                if (!exceeds) {
                    best.setAiRecommended(true);
                    best.setRecommendationSource(response.getSource() != null ? response.getSource() : ("MICROSERVICE".equalsIgnoreCase(aiRecommendationMode) ? "MICROSERVICE" : "GEMINI"));
                } else {
                    best.setAiRecommended(false);
                }
            }
        } else {
            // Fallback: sort by Base Score DESC
            sortedList = new ArrayList<>(requests);
            sortedList.sort((r1, r2) -> {
                BigDecimal s1 = r1.getAiScore() != null ? r1.getAiScore() : BigDecimal.ZERO;
                BigDecimal s2 = r2.getAiScore() != null ? r2.getAiScore() : BigDecimal.ZERO;
                return s2.compareTo(s1);
            });

            if (!sortedList.isEmpty()) {
                PickupRequestResponse best = sortedList.get(0);
                boolean exceeds = false;
                if (capacityLiters.compareTo(BigDecimal.ZERO) > 0 && best.getVolumenAproximado() != null && best.getVolumenAproximado().compareTo(capacityLiters) > 0) {
                    exceeds = true;
                }
                if (!exceeds && (best.getAiScore() == null || best.getAiScore().compareTo(BigDecimal.ZERO) > 0)) {
                    best.setAiRecommended(true);
                    best.setRecommendationSource("BASE_SCORE");
                    best.setAiReason("Recomendación calculada considerando cercanía, capacidad aprovechada e ingreso estimado (Fallback).");
                    best.setAiTags(List.of("Recomendado", "Optimizado"));
                }
            }
        }

        // Set Rank
        int rank = 1;
        for (PickupRequestResponse req : sortedList) {
            req.setAiRank(rank++);
            if (req.getRecommendationSource() == null) {
                req.setRecommendationSource("NONE");
            }
        }

        return sortedList;
    }
}
