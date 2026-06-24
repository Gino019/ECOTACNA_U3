package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransportUnitRequest {
    private Long empresaRecolectoraId;

    @NotBlank(message = "La placa es obligatoria")
    private String placa;

    private String marca;
    @jakarta.validation.constraints.Size(max = 20, message = "El modelo no puede superar 20 caracteres")
    private String modelo;

    @NotNull(message = "capacidadLitros es obligatorio")
    @DecimalMin(value = "1", message = "La capacidad debe ser mayor a 0 litros.")
    @jakarta.validation.constraints.DecimalMax(value = "5000", message = "La capacidad máxima permitida es 5000 litros.")
    private BigDecimal capacidadLitros;

    private String tipoUnidad;
    private String estado;
    private String observaciones;
}
