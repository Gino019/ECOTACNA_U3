package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.CaptchaResponseDto;
import com.GAKOM_ECOTACNA.ECOTACNA.service.CaptchaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/captcha")
public class PublicCaptchaController {

    private final CaptchaService captchaService;

    public PublicCaptchaController(CaptchaService captchaService) {
        this.captchaService = captchaService;
    }

    @GetMapping("/challenge")
    public ResponseEntity<ApiResponse<CaptchaResponseDto>> getChallenge() {
        CaptchaResponseDto challenge = captchaService.generateChallenge();
        return ResponseEntity.ok(new ApiResponse<>(true, "Desafío generado correctamente", challenge));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verifyChallenge(@org.springframework.web.bind.annotation.RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.CaptchaVerifyRequestDto request) {
        boolean valid = captchaService.verifyChallenge(request.getCaptchaToken(), request.getUserX());
        if (valid) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Captcha verificado correctamente", null));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Captcha incorrecto o expirado", null));
        }
    }
}
