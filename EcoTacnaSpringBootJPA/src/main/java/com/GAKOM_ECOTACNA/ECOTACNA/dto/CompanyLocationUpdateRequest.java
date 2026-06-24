package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.Data;

@Data
public class CompanyLocationUpdateRequest {
    private Double latitude;
    private Double longitude;
    private String placeId;
    private String placeName;
    private String formattedAddress;
    private String locationSource;
}
