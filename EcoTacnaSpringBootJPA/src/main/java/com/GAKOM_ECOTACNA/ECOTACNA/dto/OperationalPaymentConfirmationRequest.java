package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class OperationalPaymentConfirmationRequest {

    @NotNull(message = "litrosConfirmados es obligatorio")
    @DecimalMin(value = "0.01", message = "litrosConfirmados debe ser mayor a 0")
    private BigDecimal litrosConfirmados;


    private String observacionPago;

    public BigDecimal getLitrosConfirmados() {
        return litrosConfirmados;
    }

    public void setLitrosConfirmados(BigDecimal litrosConfirmados) {
        this.litrosConfirmados = litrosConfirmados;
    }


    public String getObservacionPago() {
        return observacionPago;
    }

    public void setObservacionPago(String observacionPago) {
        this.observacionPago = observacionPago;
    }
}
