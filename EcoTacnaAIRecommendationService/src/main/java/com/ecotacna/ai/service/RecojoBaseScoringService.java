package com.ecotacna.ai.service;

import com.ecotacna.ai.dto.RecojoCandidateRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class RecojoBaseScoringService {

    public BigDecimal calculateBaseScore(RecojoCandidateRequest metrics) {
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

    public void sortCandidates(List<RecojoCandidateRequest> candidates) {
        // Asignar score a cada uno
        for (RecojoCandidateRequest candidate : candidates) {
            candidate.setBaseScore(calculateBaseScore(candidate));
        }

        // Ordenar de mayor a menor score base. Exceden capacidad van al final (su score será 0)
        candidates.sort(Comparator.comparing(RecojoCandidateRequest::getBaseScore).reversed());
    }

    private BigDecimal calculateCapacidadScore(RecojoCandidateRequest metrics) {
        if (metrics.getCapacityUsagePercent() == null) return BigDecimal.ZERO;
        BigDecimal percent = metrics.getCapacityUsagePercent();
        if (percent.compareTo(new BigDecimal("100")) > 0) return BigDecimal.ZERO;
        return percent;
    }

    private BigDecimal calculateCercaniaScore(RecojoCandidateRequest metrics) {
        if (metrics.getDistanceKm() == null) return BigDecimal.ZERO;
        double distance = metrics.getDistanceKm().doubleValue();
        if (distance <= 1.0) return new BigDecimal("100");
        if (distance >= 25.0) return new BigDecimal("10");
        
        double score = 100.0 - ((distance - 1.0) / 24.0) * 90.0;
        return new BigDecimal(score).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateIngresoScore(RecojoCandidateRequest metrics) {
        if (metrics.getEstimatedRevenue() == null) return BigDecimal.ZERO;
        double revenue = metrics.getEstimatedRevenue().doubleValue();
        if (revenue >= 500.0) return new BigDecimal("100");
        if (revenue <= 0.0) return BigDecimal.ZERO;
        return new BigDecimal((revenue / 500.0) * 100.0).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateUrgenciaScore(RecojoCandidateRequest metrics) {
        if (metrics.getRemainingMinutes() == null) return new BigDecimal("50");
        long minutes = metrics.getRemainingMinutes();
        if (minutes <= 60) return new BigDecimal("100");
        if (minutes >= 2880) return new BigDecimal("20");
        
        double score = 100.0 - ((minutes - 60.0) / 2820.0) * 80.0;
        return new BigDecimal(score).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateCoordenadasScore(RecojoCandidateRequest metrics) {
        if (metrics.getHasValidCoordinates() != null && metrics.getHasValidCoordinates()) {
            return new BigDecimal("100");
        }
        return BigDecimal.ZERO;
    }
}
