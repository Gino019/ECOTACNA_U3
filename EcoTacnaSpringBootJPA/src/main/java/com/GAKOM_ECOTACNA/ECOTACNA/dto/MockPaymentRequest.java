package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MockPaymentRequest {
    @NotNull
    private Long paymentId;
    
    private boolean simulateApproval = true;
}
