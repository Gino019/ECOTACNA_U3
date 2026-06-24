package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotNull(message = "El RUC es obligatorio")
    @Pattern(regexp = "\\d{11}", message = "El RUC debe constar de 11 dígitos numéricos")
    private String ruc;

    @NotNull(message = "El email corporativo es obligatorio")
    @Email(message = "El formato de email es inválido")
    @Size(max = 150)
    private String email;

    @NotNull(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 50, message = "La contraseña debe tener entre 8 y 50 caracteres")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$", message = "La contraseña debe contener al menos una letra y un número")
    private String password;

    @NotNull(message = "La confirmación de contraseña es obligatoria")
    private String confirmPassword;

    @NotNull(message = "El nombre es obligatorio")
    @Pattern(
        regexp = "^(?!.*\\s{2,})(?!.*\\.{2,})(?![.\\-'\\s])(?!.*[.\\-'\\s]$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ .'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$",
        message = "Ingrese un nombre de contacto válido. Use solo letras, espacios, punto, guion o apóstrofo."
    )
    @Size(min = 3, max = 80, message = "La persona de contacto debe tener entre 3 y 80 caracteres.")
    private String firstName;

    @NotNull(message = "El apellido es obligatorio")
    @Size(max = 100)
    private String lastName;

    @NotNull(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^9\\d{8}$", message = "El teléfono debe ser un celular peruano válido de 9 dígitos que empiece con 9.")
    private String phone;

    @NotNull(message = "El rol de la empresa es obligatorio")
    private Role role;

    @NotNull(message = "La latitud es obligatoria")
    private java.math.BigDecimal latitude;

    @NotNull(message = "La longitud es obligatoria")
    private java.math.BigDecimal longitude;

    private java.util.List<BranchRequest> branches;

    private TransportUnitRegistrationRequest transportUnit;

    @Data
    public static class BranchRequest {
        @NotNull(message = "El nombre de la sede es obligatorio")
        private String name;

        @NotNull(message = "La latitud de la sede es obligatoria")
        private java.math.BigDecimal latitude;

        @NotNull(message = "La longitud de la sede es obligatoria")
        private java.math.BigDecimal longitude;

        private String referenceAddress;
    }

    @Data
    public static class TransportUnitRegistrationRequest {
        @NotNull(message = "La placa es obligatoria")
        @Pattern(regexp = "^[A-Z0-9-]{6,8}$", message = "Placa inválida")
        private String plate;

        @NotNull(message = "La marca es obligatoria")
        private String brand;

        @NotNull(message = "El modelo es obligatorio")
        @jakarta.validation.constraints.Size(max = 20, message = "El modelo no puede superar 20 caracteres")
        private String model;

        private String unitType;

        @NotNull(message = "La capacidad es obligatoria")
        @jakarta.validation.constraints.DecimalMin(value = "1", message = "La capacidad debe ser mayor a 0 litros.")
        @jakarta.validation.constraints.DecimalMax(value = "5000", message = "La capacidad máxima permitida es 5000 litros.")
        private java.math.BigDecimal capacityLiters;
    }
}
