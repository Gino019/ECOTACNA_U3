package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoginRequest {

    @NotNull(message = "El email corporativo es obligatorio")
    @Email(message = "El email debe ser válido")
    private String email;

    @NotNull(message = "La contraseña es obligatoria")
    private String password;

    private String captchaToken;
}
