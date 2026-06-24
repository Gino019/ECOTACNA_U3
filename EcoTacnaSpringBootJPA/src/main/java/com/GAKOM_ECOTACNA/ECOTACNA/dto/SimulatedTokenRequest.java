package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SimulatedTokenRequest {

    @NotBlank(message = "El numero de tarjeta es obligatorio.")
    private String cardNumber;

    @NotBlank(message = "El CVV es obligatorio.")
    private String cvv;

    @NotBlank(message = "La fecha de vencimiento es obligatoria.")
    private String expiry;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo debe tener un formato valido.")
    private String email;

    @NotBlank(message = "El titular de tarjeta es obligatorio.")
    private String cardholderName;
}
