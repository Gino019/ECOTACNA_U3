package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestIncidentResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.service.PickupRequestIncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
    "/api/empresa/solicitudes/{requestId}/incidencias",
    "/api/empresas/solicitudes/{requestId}/incidencias"
})
@RequiredArgsConstructor
public class PickupRequestIncidentController {

    private final PickupRequestIncidentService incidentService;

    @PostMapping
    public ResponseEntity<PickupRequestIncidentResponse> reportIncident(
            @PathVariable Long requestId,
            @Valid @RequestBody PickupRequestIncidentRequest requestDto,
            Authentication authentication) {
        String userEmail = authentication.getName();
        PickupRequestIncidentResponse response = incidentService.reportIncident(requestId, requestDto, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PickupRequestIncidentResponse>> getIncidents(
            @PathVariable Long requestId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<PickupRequestIncidentResponse> response = incidentService.getIncidentsByRequestId(requestId, userEmail);
        return ResponseEntity.ok(response);
    }
}
