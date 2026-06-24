package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ProfileSubscriptionStatusResponse {
    private CompanyType tipoEmpresa;
    private String planNombre;
    private BigDecimal precioMensual;
    private SubscriptionStatus estadoSuscripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFinPrueba;
    private LocalDate fechaVencimiento;
    private Long diasRestantes;
    private Boolean pruebaActiva;
    private Boolean cancelacionProgramada;
    private Boolean puedeCancelar;
    private Boolean puedeRenovar;
    private String mensajeEstado;
}
