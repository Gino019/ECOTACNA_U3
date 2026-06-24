package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PickupRequestIncidentRequest {

    @NotBlank(message = "El motivo de la incidencia es obligatorio")
    @Size(max = 80, message = "El motivo no puede exceder los 80 caracteres")
    private String reasonCode;

    @Size(max = 255, message = "El motivo personalizado no puede exceder los 255 caracteres")
    private String customReason;

    @Size(max = 1500, message = "La descripción no puede exceder los 1500 caracteres")
    private String description;
}
