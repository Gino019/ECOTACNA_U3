package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PlanResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionPlan;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/planes")
public class PublicPlanController {

    private final SubscriptionPlanRepository planRepository;

    @Autowired
    public PublicPlanController(SubscriptionPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanResponse>>> getActivePlans() {
        List<SubscriptionPlan> plans = planRepository.findAll()
                .stream()
                .filter(SubscriptionPlan::getActive)
                .collect(Collectors.toList());

        List<PlanResponse> response = plans.stream().map(plan -> PlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .companyType(plan.getCompanyType().name())
                .monthlyAmount(plan.getMonthlyAmount())
                .currency(plan.getCurrency())
                .trialDays(plan.getTrialDays())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(true, "Planes activos recuperados exitosamente", response));
    }
}
