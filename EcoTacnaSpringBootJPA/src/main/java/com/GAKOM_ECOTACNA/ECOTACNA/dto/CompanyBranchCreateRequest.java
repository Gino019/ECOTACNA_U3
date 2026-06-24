package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

@Data
public class CompanyBranchCreateRequest {
    private String name;
    private String reference;
    private Double latitude;
    private Double longitude;
    private String address;
    private String placeId;
}
