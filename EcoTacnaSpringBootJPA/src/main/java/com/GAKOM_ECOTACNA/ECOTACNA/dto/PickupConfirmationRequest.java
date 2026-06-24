package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PickupConfirmationRequest {

    @NotNull(message = "volumenReal es obligatorio")
    @DecimalMin(value = "0.01", message = "volumenReal debe ser mayor a 0")
    private BigDecimal volumenReal;

    @NotNull(message = "El precio por litro es obligatorio al confirmar")
    @jakarta.validation.constraints.DecimalMin(value = "2.00", message = "El precio mínimo es S/ 2.00")
    @jakarta.validation.constraints.DecimalMax(value = "3.00", message = "El precio máximo es S/ 3.00")
    private BigDecimal precioPorLitro;

    public BigDecimal getPrecioPorLitro() {
        return precioPorLitro;
    }

    public void setPrecioPorLitro(BigDecimal precioPorLitro) {
        this.precioPorLitro = precioPorLitro;
    }

    public BigDecimal getVolumenReal() {
        return volumenReal;
    }

    public void setVolumenReal(BigDecimal volumenReal) {
        this.volumenReal = volumenReal;
    }
}
