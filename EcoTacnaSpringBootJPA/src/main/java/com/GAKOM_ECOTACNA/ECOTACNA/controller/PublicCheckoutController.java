package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PublicCheckoutResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionPlan;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/public/checkout")
public class PublicCheckoutController {

    private final CompanyRepository companyRepository;
    private final SubscriptionPlanRepository planRepository;

    public PublicCheckoutController(CompanyRepository companyRepository, SubscriptionPlanRepository planRepository) {
        this.companyRepository = companyRepository;
        this.planRepository = planRepository;
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ApiResponse<PublicCheckoutResponse>> getCompanyCheckoutSummary(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("No se encontro la empresa aprobada."));

        SubscriptionPlan plan = planRepository.findByCompanyTypeAndActiveTrue(company.getCompanyType())
                .orElseThrow(() -> new BusinessException("No se encontro plan activo para este tipo de empresa."));

        BigDecimal todayAmount = plan.getTrialDays() != null && plan.getTrialDays() > 0
                ? BigDecimal.ZERO
                : plan.getMonthlyAmount();

        PublicCheckoutResponse response = PublicCheckoutResponse.builder()
                .companyId(company.getId())
                .companyName(company.getBusinessName())
                .companyType(company.getCompanyType().name())
                .planId(plan.getId())
                .planCode(plan.getCode())
                .planName(plan.getName())
                .monthlyAmount(plan.getMonthlyAmount())
                .currency(plan.getCurrency())
                .trialDays(plan.getTrialDays())
                .todayAmount(todayAmount)
                .status(company.getSubscriptionStatus() != null ? company.getSubscriptionStatus().name() : "APROBADA")
                .build();

        return ResponseEntity.ok(new ApiResponse<>(true, "Resumen de checkout cargado exitosamente", response));
    }
}
