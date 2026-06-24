package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PickupRequestRequest {
    @NotNull(message = "volumenAproximado es obligatorio")
    @DecimalMin(value = "0.01", message = "El volumen aproximado debe ser mayor a 0")
    @DecimalMax(value = "5000.00", message = "La cantidad estimada no puede superar los 5000 litros")
    private BigDecimal volumenAproximado;

    private LocalDateTime fechaProgramada;

    private String direccion;

    private String observaciones;

    private BigDecimal precioOfertadoPorLitro;

    private BigDecimal pickupLatitude;

    private BigDecimal pickupLongitude;
}
