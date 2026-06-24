package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyLocationResponse {
    private Long id;
    private String name;
    private String referenceAddress;
    private BigDecimal latitude;
    private BigDecimal longitude;
    
    @JsonProperty("isPrimary")
    private boolean isPrimary;
}
