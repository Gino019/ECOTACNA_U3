package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectRequestDto {
    @JsonProperty("motivo")
    private String motivo;
    
    @JsonProperty("observacion")
    private String observacion;
    
    @JsonProperty("tipoRechazo")
    private String tipoRechazo;
}

