package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SubscriptionRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.service.AdminSubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/suscripciones")
public class AdminSubscriptionController {

    private final AdminSubscriptionService adminSubscriptionService;

    @Autowired
    public AdminSubscriptionController(AdminSubscriptionService adminSubscriptionService) {
        this.adminSubscriptionService = adminSubscriptionService;
    }

    @PutMapping("/{empresaId}")
    public ResponseEntity<ApiResponse<String>> updateSubscription(
            @PathVariable Long empresaId,
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        
        Company updated = adminSubscriptionService.updateSubscription(
                empresaId, 
                request.getSubscriptionStatus(), 
                principal.getUser(), 
                servletRequest.getRemoteAddr());
                
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado de suscripción actualizado a " + updated.getSubscriptionStatus(), null));
    }
}
