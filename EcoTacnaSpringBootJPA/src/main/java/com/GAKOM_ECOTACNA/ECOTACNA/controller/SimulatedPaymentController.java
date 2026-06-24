package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedPaymentConfirmRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedPaymentResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedTokenRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedTokenResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.service.SimulatedPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/payments/simulated")
public class SimulatedPaymentController {

    private final SimulatedPaymentService simulatedPaymentService;

    public SimulatedPaymentController(SimulatedPaymentService simulatedPaymentService) {
        this.simulatedPaymentService = simulatedPaymentService;
    }

    @PostMapping("/tokens")
    public ResponseEntity<ApiResponse<SimulatedTokenResponse>> createToken(@Valid @RequestBody SimulatedTokenRequest request) {
        SimulatedTokenResponse response = simulatedPaymentService.createToken(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Token simulado creado correctamente", response));
    }

    @PostMapping("/company/{companyId}/confirm")
    public ResponseEntity<ApiResponse<SimulatedPaymentResponse>> confirmPayment(
            @PathVariable Long companyId,
            @Valid @RequestBody SimulatedPaymentConfirmRequest request) {
        SimulatedPaymentResponse response = simulatedPaymentService.confirmPayment(companyId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, response.getMessage(), response));
    }
}
