package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationStatusResponse {
    private boolean exists;
    private String ruc;
    private Long companyId;
    private String razonSocial;
    private String tipoEmpresa;
    private String correoContacto;
    private String subscriptionStatus;
    private String nextStep;
    private String message;
}
