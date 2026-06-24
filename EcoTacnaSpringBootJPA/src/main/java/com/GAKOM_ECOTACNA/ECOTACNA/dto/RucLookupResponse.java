package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RucLookupResponse {
    private String ruc;
    private String razonSocial;
    private String nombreComercial;
    private String direccionFiscal;
    private String distrito;
    private String provincia;
    private String departamento;
    private String estadoContribuyente;
    private String condicionDomicilio;
    private String fuente;
}
