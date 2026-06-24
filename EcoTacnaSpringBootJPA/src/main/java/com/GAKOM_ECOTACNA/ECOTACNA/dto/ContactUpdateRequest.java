package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ContactUpdateRequest {

    @NotBlank(message = "La persona de contacto es obligatoria")
    @Pattern(regexp = "^(?!.*\\s{2,})(?!.*\\.{2,})(?![.\\-'\\s])(?!.*[.\\-'\\s]$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$",
            message = "Ingrese un nombre de contacto válido. Use solo letras, espacios, punto, guion o apóstrofo.")
    private String contactPerson;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico es inválido")
    private String email;

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^9\\d{8}$", message = "Ingrese un celular peruano válido de 9 dígitos que empiece con 9.")
    private String phone;
}
