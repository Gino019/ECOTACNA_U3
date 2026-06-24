package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PaymentInitResponse {
    private Long paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String providerPaymentId;
}
