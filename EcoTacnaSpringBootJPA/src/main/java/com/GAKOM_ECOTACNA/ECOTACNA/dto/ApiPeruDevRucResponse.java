package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApiPeruDevRucResponse {

    private String ruc;

    @JsonProperty("nombre_o_razon_social")
    private String nombreORazonSocial;

    @JsonProperty("nombre_comercial")
    private String nombreComercial;

    private String direccion;
    private String distrito;
    private String provincia;
    private String departamento;
    private String estado;
    private String condicion;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wrapper {
        private Boolean success;
        private ApiPeruDevRucResponse data;
    }
}
