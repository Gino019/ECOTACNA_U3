package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.*;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/init")
    public ResponseEntity<ApiResponse<PaymentInitResponse>> initPayment(@AuthenticationPrincipal User user, @Valid @RequestBody PaymentInitRequest request) {
        PaymentInitResponse response = paymentService.initPayment(user, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pago inicializado", response));
    }

    @PostMapping("/mock/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmMockPayment(@AuthenticationPrincipal User user, @Valid @RequestBody MockPaymentRequest request) {
        PaymentResponse response = paymentService.confirmMockPayment(user, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pago procesado via Mock", response));
    }
}
