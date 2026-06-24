package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVehicleDto {
    private String plate;
    private String unitType;
    private BigDecimal capacityLiters;
    private String status;
    private String brand;
    private String model;
    private LocalDateTime registrationDate;
}
