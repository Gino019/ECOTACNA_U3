package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

@Data
public class CaptchaVerifyRequestDto {
    private String captchaToken;
    private int userX;
}
