package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RucLookupResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ExternalProviderException;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ResourceNotFoundException;
import com.GAKOM_ECOTACNA.ECOTACNA.service.ApiPeruDevRucService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ruc")
public class RucLookupController {

    private final ApiPeruDevRucService apiPeruDevRucService;

    public RucLookupController(ApiPeruDevRucService apiPeruDevRucService) {
        this.apiPeruDevRucService = apiPeruDevRucService;
    }

    @GetMapping("/{ruc}")
    public ResponseEntity<ApiResponse<RucLookupResponse>> consultarRuc(@PathVariable String ruc) {
        try {
            RucLookupResponse response = apiPeruDevRucService.consultarRuc(ruc);
            return ResponseEntity.ok(new ApiResponse<>(true, "Datos encontrados", response));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        } catch (ExternalProviderException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        } catch (BusinessException ex) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, ex.getMessage(), null));
        }
    }
}
