package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PickupAssignmentRequest {
    @NotNull(message = "recolectorId es obligatorio")
    private Long recolectorId;

    private Long transporteId;
}
