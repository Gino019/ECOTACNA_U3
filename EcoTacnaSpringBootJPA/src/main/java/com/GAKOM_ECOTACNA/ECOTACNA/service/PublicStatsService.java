package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.PublicStatsResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PickupRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PublicStatsService {

    private final CompanyRepository companyRepository;
    private final PickupRequestRepository pickupRequestRepository;

    @Autowired
    public PublicStatsService(CompanyRepository companyRepository, PickupRequestRepository pickupRequestRepository) {
        this.companyRepository = companyRepository;
        this.pickupRequestRepository = pickupRequestRepository;
    }

    @Transactional(readOnly = true)
    public PublicStatsResponse getLandingStats() {
        List<com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus> activeStatuses = List.of(
            com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus.ACTIVA, 
            com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus.PRUEBA_ACTIVA
        );

        long empresasActivas = companyRepository.countByCompanyTypeAndSubscriptionStatusIn(CompanyType.GENERADORA, activeStatuses);
        long recolectoresActivos = companyRepository.countByCompanyTypeAndSubscriptionStatusIn(CompanyType.RECOLECTORA, activeStatuses);

        // Fetch all completed or picked up requests
        List<PickupRequest> completedRequests = pickupRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.COMPLETADO || r.getStatus() == PickupRequestStatus.RECOGIDO)
                .collect(Collectors.toList());

        BigDecimal litrosRecolectados = completedRequests.stream()
                .map(r -> r.getLitrosConfirmados() != null ? r.getLitrosConfirmados()
                        : (r.getActualVolumeLiters() != null ? r.getActualVolumeLiters() 
                        : (r.getApproximateVolumeLiters() != null ? r.getApproximateVolumeLiters() : BigDecimal.ZERO)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pagosProcesados = completedRequests.stream()
                .map(r -> {
                    if (r.getMontoTotal() != null) return r.getMontoTotal();
                    BigDecimal liters = r.getLitrosConfirmados() != null ? r.getLitrosConfirmados() : BigDecimal.ZERO;
                    BigDecimal price = r.getPrecioPorLitro() != null ? r.getPrecioPorLitro() : BigDecimal.ZERO;
                    return liters.multiply(price);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PublicStatsResponse.builder()
                .empresasActivas(empresasActivas)
                .recolectoresActivos(recolectoresActivos)
                .litrosRecolectados(litrosRecolectados)
                .pagosProcesados(pagosProcesados)
                .build();
    }
}
