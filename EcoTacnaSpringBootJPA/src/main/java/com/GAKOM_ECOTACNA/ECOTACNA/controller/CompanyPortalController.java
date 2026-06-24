package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.CompanySummaryResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.service.CompanyPortalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class CompanyPortalController {

    private final CompanyPortalService companyPortalService;

    @Autowired
    public CompanyPortalController(CompanyPortalService companyPortalService) {
        this.companyPortalService = companyPortalService;
    }

    @GetMapping("/api/empresa/perfil")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = companyPortalService.getProfile(principal.getCompany().getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Datos de empresa", data));
    }

    @GetMapping("/api/empresa/resumen")
    public ResponseEntity<ApiResponse<CompanySummaryResponse>> summary(
            @AuthenticationPrincipal UserPrincipal principal) {
        CompanySummaryResponse data = companyPortalService.getSummary(principal.getCompany().getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Resumen empresa", data));
    }

    @org.springframework.web.bind.annotation.PutMapping("/api/empresa/perfil/contacto")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileUpdateResponse>> updateContact(
            @AuthenticationPrincipal UserPrincipal principal,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.ContactUpdateRequest request,
            @Autowired com.GAKOM_ECOTACNA.ECOTACNA.security.JwtTokenProvider tokenProvider) {
        
        com.GAKOM_ECOTACNA.ECOTACNA.model.User updatedUser = companyPortalService.updateContactData(principal.getUser().getId(), request);
        Map<String, Object> updatedProfile = companyPortalService.getProfile(principal.getCompany().getId());
        
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

    @GetMapping("/api/empresa/dashboard-general")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.CompanyGeneralDashboardResponse>> dashboardGeneral(
            @AuthenticationPrincipal UserPrincipal principal) {
        com.GAKOM_ECOTACNA.ECOTACNA.dto.CompanyGeneralDashboardResponse data = companyPortalService.getDashboardGeneral(principal.getUser());
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard empresa", data));
    }

    @org.springframework.web.bind.annotation.PutMapping("/api/empresa/ubicaciones/{id}")
    public ResponseEntity<ApiResponse<String>> updateLocation(
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springframework.web.bind.annotation.PathVariable("id") Long locationId,
            @org.springframework.web.bind.annotation.RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.CompanyLocationUpdateRequest request) {
        
        companyPortalService.updateCompanyLocation(principal.getCompany().getId(), locationId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Ubicación actualizada correctamente.", null));
    }

    @org.springframework.web.bind.annotation.PostMapping("/api/empresa/ubicaciones")
    public ResponseEntity<ApiResponse<String>> createLocation(
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springframework.web.bind.annotation.RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.CompanyBranchCreateRequest request) {
        
        companyPortalService.createCompanyBranch(principal.getCompany().getId(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Sede agregada correctamente.", null));
    }
}
