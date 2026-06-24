package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PublicStatsResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.service.PublicStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final PublicStatsService publicStatsService;

    @Autowired
    public PublicController(PublicStatsService publicStatsService) {
        this.publicStatsService = publicStatsService;
    }

    @GetMapping("/landing-stats")
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getLandingStats() {
        PublicStatsResponse stats = publicStatsService.getLandingStats();
        return ResponseEntity.ok(new ApiResponse<>(true, "Estadísticas públicas EcoTacna", stats));
    }
}
