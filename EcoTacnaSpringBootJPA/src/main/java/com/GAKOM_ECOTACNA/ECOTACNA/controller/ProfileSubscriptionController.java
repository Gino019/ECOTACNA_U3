package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.MessageResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileSubscriptionStatusResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.service.ProfileSubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile/subscription")
public class ProfileSubscriptionController {

    private final ProfileSubscriptionService profileSubscriptionService;

    @Autowired
    public ProfileSubscriptionController(ProfileSubscriptionService profileSubscriptionService) {
        this.profileSubscriptionService = profileSubscriptionService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<ProfileSubscriptionStatusResponse>> getStatus(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        ProfileSubscriptionStatusResponse response = profileSubscriptionService.getSubscriptionStatus(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado de suscripción", response));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<MessageResponse>> cancelSubscription(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        MessageResponse response = profileSubscriptionService.cancelSubscription(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Operación exitosa", response));
    }

    @PostMapping("/renew")
    public ResponseEntity<ApiResponse<MessageResponse>> renewSubscription(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        MessageResponse response = profileSubscriptionService.renewSubscription(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Operación exitosa", response));
    }
}
