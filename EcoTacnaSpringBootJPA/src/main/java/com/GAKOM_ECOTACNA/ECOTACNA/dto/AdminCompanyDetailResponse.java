package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCompanyDetailResponse {
    // Empresa
    private Long companyId;
    private String businessName;
    private String ruc;
    private String companyType;
    private String subscriptionStatus;
    private String address;
    private String district;
    private String province;
    private String department;
    
    // Usuario / Contacto
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private LocalDateTime registrationDate;

    // Suscripción / Pagos
    private String planName;
    private BigDecimal monthlyAmount;
    private LocalDateTime startDate;
    private LocalDateTime currentPeriodEnd;
    private BigDecimal lastPaymentAmount;
    private LocalDateTime lastPaymentDate;

    // Actividad
    private Integer totalRequests;
    private Double totalLitersCollected;
    private LocalDateTime lastActivityDate;

    // Vehículos (para recolectoras)
    private List<AdminVehicleDto> vehicles;
}
