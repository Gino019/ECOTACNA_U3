package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AuthResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.LoginRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RegisterRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;

import com.GAKOM_ECOTACNA.ECOTACNA.security.JwtTokenProvider;
import com.GAKOM_ECOTACNA.ECOTACNA.service.AuthService;
import com.GAKOM_ECOTACNA.ECOTACNA.service.CaptchaService;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private final AuthService authService;
        private final JwtTokenProvider jwtTokenProvider;
        private final CaptchaService captchaService;

        @Autowired
        public AuthController(AuthService authService, JwtTokenProvider jwtTokenProvider,
                        CaptchaService captchaService) {
                this.authService = authService;
                this.jwtTokenProvider = jwtTokenProvider;
                this.captchaService = captchaService;
        }

        /**
         * Endpoint para el registro formal B2B.
         */
        @PostMapping("/register")
        public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                        HttpServletRequest servletRequest) {
                String ipAddress = servletRequest.getRemoteAddr();

                User user = authService.registerCompany(request, ipAddress);

                String token = jwtTokenProvider.createToken(
                                user.getEmail(),
                                user.getRole().name(),
                                user.getCompany() != null ? user.getCompany().getId() : null,
                                user.getCompany() != null ? user.getCompany().getBusinessName() : "SOPORTE GLOBAL");

                AuthResponse response = AuthResponse.builder()
                                .token(token)
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .companyName(user.getCompany() != null ? user.getCompany().getBusinessName()
                                                : "ADMINISTRACIÓN")
                                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                                .userId(user.getId())
                                .companyType(user.getCompany() != null && user.getCompany().getCompanyType() != null
                                                ? user.getCompany().getCompanyType().name()
                                                : null)
                                .subscriptionStatus(user.getCompany() != null
                                                && user.getCompany().getSubscriptionStatus() != null
                                                                ? user.getCompany().getSubscriptionStatus().name()
                                                                : null)
                                .build();

                return new ResponseEntity<>(response, HttpStatus.CREATED);
        }

        /**
         * Endpoint para el inicio de sesión y obtención del token JWT.
         */
        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
                if (!captchaService.validateToken(request.getCaptchaToken())) {
                        throw new BusinessException("Verificación de seguridad inválida. Intenta nuevamente.");
                }

                User user = authService.authenticate(request.getEmail(), request.getPassword());

                String token = jwtTokenProvider.createToken(
                                user.getEmail(),
                                user.getRole().name(),
                                user.getCompany() != null ? user.getCompany().getId() : null,
                                user.getCompany() != null ? user.getCompany().getBusinessName() : "SOPORTE GLOBAL");

                AuthResponse response = AuthResponse.builder()
                                .token(token)
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .companyName(user.getCompany() != null ? user.getCompany().getBusinessName()
                                                : "ADMINISTRACIÓN")
                                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                                .userId(user.getId())
                                .companyType(user.getCompany() != null && user.getCompany().getCompanyType() != null
                                                ? user.getCompany().getCompanyType().name()
                                                : null)
                                .subscriptionStatus(user.getCompany() != null
                                                && user.getCompany().getSubscriptionStatus() != null
                                                                ? user.getCompany().getSubscriptionStatus().name()
                                                                : null)
                                .build();

                return ResponseEntity.ok(response);
        }

        /**
         * Endpoint exclusivo para el inicio de sesión de escritorio sin Captcha y con
         * rol ADMIN.
         */
        @PostMapping("/admin-desktop-login")
        public ResponseEntity<AuthResponse> adminDesktopLogin(@Valid @RequestBody LoginRequest request) {
                // 1. Autenticar usuario con email y contraseña normales (Sin validar Captcha)
                User user = authService.authenticate(request.getEmail(), request.getPassword());

                // 2. Validar estrictamente que el rol sea ADMIN
                if (user.getRole() == null || !user.getRole().name().equals("ADMIN")) {
                        throw new BusinessException(
                                        "Acceso denegado: Este endpoint es exclusivo para administradores.");
                }

                // 3. Generar el Token JWT
                String token = jwtTokenProvider.createToken(
                                user.getEmail(),
                                user.getRole().name(),
                                user.getCompany() != null ? user.getCompany().getId() : null,
                                user.getCompany() != null ? user.getCompany().getBusinessName() : "SOPORTE GLOBAL");

                // 4. Construir la respuesta con los 8 campos solicitados usando tu AuthResponse
                // existente
                AuthResponse response = AuthResponse.builder()
                                .token(token)
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .companyName(user.getCompany() != null ? user.getCompany().getBusinessName()
                                                : "ADMINISTRACIÓN")
                                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                                .userId(user.getId())
                                .companyType(user.getCompany() != null && user.getCompany().getCompanyType() != null
                                                ? user.getCompany().getCompanyType().name()
                                                : null)
                                .subscriptionStatus(user.getCompany() != null
                                                && user.getCompany().getSubscriptionStatus() != null
                                                                ? user.getCompany().getSubscriptionStatus().name()
                                                                : null)
                                .build();

                return ResponseEntity.ok(response);
        }

        /**
         * Endpoint para consultar el estado del registro de una empresa por RUC.
         */
        @org.springframework.web.bind.annotation.GetMapping("/registration-status/{ruc}")
        public ResponseEntity<com.GAKOM_ECOTACNA.ECOTACNA.dto.RegistrationStatusResponse> getRegistrationStatus(
                        @org.springframework.web.bind.annotation.PathVariable String ruc) {
                return ResponseEntity.ok(authService.consultarEstadoRegistroPorRuc(ruc));
        }
}
