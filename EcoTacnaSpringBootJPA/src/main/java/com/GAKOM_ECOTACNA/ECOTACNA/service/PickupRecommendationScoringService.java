package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRecommendationMetrics;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PickupRecommendationScoringService {

    private static final BigDecimal DEFAULT_PRICE_PER_LITER = new BigDecimal("2.50");

    public BigDecimal calculateBaseScore(PickupRecommendationMetrics metrics) {
        if (metrics.getExceedsCapacity() != null && metrics.getExceedsCapacity()) {
            return BigDecimal.ZERO;
        }

        BigDecimal capacidadScore = calculateCapacidadScore(metrics);
        BigDecimal cercaniaScore = calculateCercaniaScore(metrics);
        BigDecimal ingresoScore = calculateIngresoScore(metrics);
        BigDecimal urgenciaScore = calculateUrgenciaScore(metrics);
        BigDecimal coordenadasScore = calculateCoordenadasScore(metrics);

        // Pesos: capacidad 30%, cercania 30%, ingreso 25%, urgencia 10%, coordenadas 5%
        BigDecimal score = BigDecimal.ZERO;
        score = score.add(capacidadScore.multiply(new BigDecimal("0.30")));
        score = score.add(cercaniaScore.multiply(new BigDecimal("0.30")));
        score = score.add(ingresoScore.multiply(new BigDecimal("0.25")));
        score = score.add(urgenciaScore.multiply(new BigDecimal("0.10")));
        score = score.add(coordenadasScore.multiply(new BigDecimal("0.05")));

        return score.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateCapacidadScore(PickupRecommendationMetrics metrics) {
        if (metrics.getCapacityUsagePercent() == null) return BigDecimal.ZERO;
        // Si usa bien la capacidad sin exceder (ej: 80%-100%), puntaje alto
        BigDecimal percent = metrics.getCapacityUsagePercent();
        if (percent.compareTo(new BigDecimal("100")) > 0) return BigDecimal.ZERO;
        // Asignar el mismo porcentaje como score (máximo 100)
        return percent;
    }

    private BigDecimal calculateCercaniaScore(PickupRecommendationMetrics metrics) {
        if (metrics.getDistanceKm() == null) return BigDecimal.ZERO;
        double distance = metrics.getDistanceKm().doubleValue();
        // Fórmula simple: muy cerca (< 2km) = 100, lejos (> 20km) = 10, etc.
        if (distance <= 1.0) return new BigDecimal("100");
        if (distance >= 25.0) return new BigDecimal("10");
        
        // Decrecimiento lineal de 1 a 25 km
        double score = 100.0 - ((distance - 1.0) / 24.0) * 90.0;
        return new BigDecimal(score).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateIngresoScore(PickupRecommendationMetrics metrics) {
        if (metrics.getEstimatedRevenue() == null) return BigDecimal.ZERO;
        double revenue = metrics.getEstimatedRevenue().doubleValue();
        // Un ingreso de 500 soles o más se considera 100.
        if (revenue >= 500.0) return new BigDecimal("100");
        if (revenue <= 0.0) return BigDecimal.ZERO;
        return new BigDecimal((revenue / 500.0) * 100.0).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateUrgenciaScore(PickupRecommendationMetrics metrics) {
        if (metrics.getRemainingMinutes() == null) return new BigDecimal("50"); // Neutral
        long minutes = metrics.getRemainingMinutes();
        // Si queda menos de 60 mins es urgente (100)
        // Si queda más de 2 días (2880 mins) no es urgente (20)
        if (minutes <= 60) return new BigDecimal("100");
        if (minutes >= 2880) return new BigDecimal("20");
        
        double score = 100.0 - ((minutes - 60.0) / 2820.0) * 80.0;
        return new BigDecimal(score).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateCoordenadasScore(PickupRecommendationMetrics metrics) {
        if (metrics.getHasValidCoordinates() != null && metrics.getHasValidCoordinates()) {
            return new BigDecimal("100");
        }
        return BigDecimal.ZERO;
    }
}
