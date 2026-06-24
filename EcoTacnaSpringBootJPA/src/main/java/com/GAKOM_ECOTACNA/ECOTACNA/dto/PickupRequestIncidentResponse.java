package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PickupRequestIncidentResponse {
    private Long id;
    private Long pickupRequestId;
    private String reasonCode;
    private String reasonLabel;
    private String customReason;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String reporterName;
    private String reporterEmail;
    private String reporterRole;
}
