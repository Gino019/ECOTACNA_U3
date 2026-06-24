package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.TransportUnitRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.TransportUnitResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.mapper.ModelMapper;
import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportUnit;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.service.TransportUnitService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class TransportUnitController {

    private final TransportUnitService transportUnitService;

    @Autowired
    public TransportUnitController(TransportUnitService transportUnitService) {
        this.transportUnitService = transportUnitService;
    }

    @GetMapping("/api/admin/transportes")
    public ResponseEntity<ApiResponse<List<TransportUnitResponse>>> listAllAdmin() {
        List<TransportUnitResponse> data = transportUnitService.listAll().stream()
                .map(ModelMapper::toTransportUnitResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Transportes", data));
    }

    @GetMapping("/api/admin/transportes/{id}")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> getByIdAdmin(@PathVariable Long id) {
        TransportUnit unit = transportUnitService.getById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Transporte encontrado",
                ModelMapper.toTransportUnitResponse(unit)));
    }

    @PostMapping("/api/admin/transportes")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> create(
            @Valid @RequestBody TransportUnitRequest request) {
        TransportUnit unit = transportUnitService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Transporte creado",
                        ModelMapper.toTransportUnitResponse(unit)));
    }

    @PutMapping("/api/admin/transportes/{id}")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> update(
            @PathVariable Long id, @Valid @RequestBody TransportUnitRequest request) {
        TransportUnit unit = transportUnitService.update(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Transporte actualizado",
                ModelMapper.toTransportUnitResponse(unit)));
    }

    @PatchMapping("/api/admin/transportes/{id}")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> changeStatus(
            @PathVariable Long id, @RequestParam String action, @RequestParam String estado) {
        if (!"estado".equalsIgnoreCase(action)) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Acción no soportada. Use action=estado", null));
        }
        TransportUnit unit = transportUnitService.changeStatus(id, estado);
        return ResponseEntity.ok(new ApiResponse<>(true, "Estado actualizado",
                ModelMapper.toTransportUnitResponse(unit)));
    }

    @GetMapping({"/api/recolector/transportes", "/api/recolector/unidades"})
    public ResponseEntity<ApiResponse<List<TransportUnitResponse>>> listByCollectorCompany(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TransportUnitResponse> data = transportUnitService
                .listByCollectorCompany(principal.getCompany().getId()).stream()
                .map(ModelMapper::toTransportUnitResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Transportes de la empresa", data));
    }

    @PostMapping("/api/recolector/unidades")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> createForCollector(
            @Valid @RequestBody TransportUnitRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        TransportUnit unit = transportUnitService.createForCollector(
                principal.getCompany(), principal.getUser(), request, ipAddress);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Unidad de transporte creada",
                        ModelMapper.toTransportUnitResponse(unit)));
    }

    @PutMapping("/api/recolector/unidades/{id}")
    public ResponseEntity<ApiResponse<TransportUnitResponse>> updateForCollector(
            @PathVariable Long id, 
            @Valid @RequestBody TransportUnitRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        TransportUnit unit = transportUnitService.updateForCollector(
                id, principal.getCompany(), principal.getUser(), request, ipAddress);
        return ResponseEntity.ok(new ApiResponse<>(true, "Unidad de transporte actualizada",
                        ModelMapper.toTransportUnitResponse(unit)));
    }
}
