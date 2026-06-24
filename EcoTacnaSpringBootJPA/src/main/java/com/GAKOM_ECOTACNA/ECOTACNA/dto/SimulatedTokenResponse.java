package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SimulatedTokenResponse {
    private String id;
    private String object;
    private String cardLast4;
    private String brand;
    private String scenario;
    private String email;
    private LocalDateTime created;
}
