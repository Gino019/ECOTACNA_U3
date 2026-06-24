package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SimulatedPaymentConfirmRequest {

    @NotBlank(message = "El metodo de pago es obligatorio.")
    private String paymentMethod;

    @NotBlank(message = "El token simulado es obligatorio.")
    private String simulatedToken;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo debe tener un formato valido.")
    private String email;
}
