package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.service.CollectorPortalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class CollectorPortalController {

    private final CollectorPortalService collectorPortalService;
    private final com.GAKOM_ECOTACNA.ECOTACNA.service.CompanyPortalService companyPortalService;

    @Autowired
    public CollectorPortalController(CollectorPortalService collectorPortalService,
                                     com.GAKOM_ECOTACNA.ECOTACNA.service.CompanyPortalService companyPortalService) {
        this.collectorPortalService = collectorPortalService;
        this.companyPortalService = companyPortalService;
    }

    @GetMapping("/api/recolector/perfil")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Perfil recolector",
                collectorPortalService.getProfile(principal.getUser())));
    }

    @GetMapping("/api/recolector/resumen")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = collectorPortalService.getSummary(principal.getUser().getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Resumen recolector", data));
    }

    @GetMapping("/api/recolector/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = collectorPortalService.getDashboard(principal.getUser());
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard recolector", data));
    }

    @GetMapping("/api/recolector/dashboard-general")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.CollectorGeneralDashboardResponse>> dashboardGeneral(
            @AuthenticationPrincipal UserPrincipal principal) {
        com.GAKOM_ECOTACNA.ECOTACNA.dto.CollectorGeneralDashboardResponse data = collectorPortalService.getDashboardGeneral(principal.getUser());
        return ResponseEntity.ok(new ApiResponse<>(true, "Panel general del recolector", data));
    }

    @org.springframework.web.bind.annotation.PutMapping("/api/recolector/perfil/contacto")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileUpdateResponse>> updateContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.ContactUpdateRequest request,
            @Autowired com.GAKOM_ECOTACNA.ECOTACNA.security.JwtTokenProvider tokenProvider) {
        
        com.GAKOM_ECOTACNA.ECOTACNA.model.User updatedUser = companyPortalService.updateContactData(principal.getUser().getId(), request);
        Map<String, Object> updatedProfile = collectorPortalService.getProfile(updatedUser);
        
        String newToken = null;
        if (!principal.getUser().getEmail().equals(updatedUser.getEmail())) {
            newToken = tokenProvider.createToken(updatedUser.getEmail(), updatedUser.getRole().name(), principal.getCompany().getId(), principal.getCompany().getBusinessName());
        }
        
        com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileUpdateResponse response = com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileUpdateResponse.builder()
                .message("Datos de contacto actualizados exitosamente")
                .newToken(newToken)
                .updatedProfile(updatedProfile)
                .build();
                
        return ResponseEntity.ok(new ApiResponse<>(true, "Perfil actualizado", response));
    }
}
