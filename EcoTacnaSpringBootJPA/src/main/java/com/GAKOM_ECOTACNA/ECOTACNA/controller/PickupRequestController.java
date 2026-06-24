package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupRequestResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.RejectRequestDto;
import com.GAKOM_ECOTACNA.ECOTACNA.mapper.ModelMapper;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.security.UserPrincipal;
import com.GAKOM_ECOTACNA.ECOTACNA.service.PickupRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import com.GAKOM_ECOTACNA.ECOTACNA.service.ConstanciaPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.GAKOM_ECOTACNA.ECOTACNA.service.HistorialExcelService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
public class PickupRequestController {

    private final PickupRequestService pickupRequestService;
    private final ConstanciaPdfService constanciaPdfService;
    private final HistorialExcelService historialExcelService;
    private final com.GAKOM_ECOTACNA.ECOTACNA.service.StorageService storageService;
    private final com.GAKOM_ECOTACNA.ECOTACNA.service.PickupRecommendationService pickupRecommendationService;

    @Autowired
    public PickupRequestController(PickupRequestService pickupRequestService, 
                                   ConstanciaPdfService constanciaPdfService,
                                   HistorialExcelService historialExcelService,
                                   com.GAKOM_ECOTACNA.ECOTACNA.service.StorageService storageService,
                                   com.GAKOM_ECOTACNA.ECOTACNA.service.PickupRecommendationService pickupRecommendationService) {
        this.pickupRequestService = pickupRequestService;
        this.constanciaPdfService = constanciaPdfService;
        this.historialExcelService = historialExcelService;
        this.storageService = storageService;
        this.pickupRecommendationService = pickupRecommendationService;
    }

    @GetMapping("/api/empresa/solicitudes")
    public ResponseEntity<ApiResponse<List<PickupRequestResponse>>> listByCompany(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<PickupRequestResponse> data = pickupRequestService
                .listByCompany(principal.getCompany().getId()).stream()
                .map(req -> pickupRequestService.enrichPickupRequestResponse(ModelMapper.toPickupRequestResponse(req), req))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Listado de solicitudes", data));
    }

    @GetMapping("/api/empresa/solicitudes/activa")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getActiveRequestForCompany(
            @AuthenticationPrincipal UserPrincipal principal) {
        PickupRequest active = pickupRequestService.findActiveRequestForCompany(principal.getCompany().getId());
        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        if (active == null) {
            responseData.put("tieneActiva", false);
            responseData.put("solicitud", null);
        } else {
            responseData.put("tieneActiva", true);
            PickupRequestResponse responseDto = ModelMapper.toPickupRequestResponse(active);
            pickupRequestService.enrichPickupRequestResponse(responseDto, active);
            
            responseData.put("solicitud", responseDto);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud activa obtenida", responseData));
    }

    @PostMapping(value = "/api/empresa/solicitudes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PickupRequestResponse>> create(
            @RequestPart("solicitud") @Valid PickupRequestRequest request,
            @RequestPart(value = "foto", required = false) org.springframework.web.multipart.MultipartFile foto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {

        String evidenciaUrl = null;
        if (foto != null && !foto.isEmpty()) {
            evidenciaUrl = storageService.store(foto);
        } else {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Debe adjuntar una foto del aceite (evidencia).");
        }

        PickupRequest created = pickupRequestService.create(
                principal.getCompany(),
                request.getVolumenAproximado(),
                request.getFechaProgramada(),
                request.getDireccion(),
                request.getObservaciones(),
                request.getPrecioOfertadoPorLitro(),
                request.getPickupLatitude(),
                request.getPickupLongitude(),
                evidenciaUrl,
                principal.getUser(),
                servletRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Solicitud creada exitosamente",
                        ModelMapper.toPickupRequestResponse(created)));
    }

    @GetMapping({"/api/recolector/solicitudes", "/api/recolector/solicitudes-aceptadas", "/api/recolector/recojos-dia"})
    public ResponseEntity<ApiResponse<List<PickupRequestResponse>>> listByCollector(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<PickupRequestResponse> data = pickupRequestService
                .listByCollector(principal.getUser().getId()).stream()
                .map(req -> pickupRequestService.enrichPickupRequestResponse(ModelMapper.toPickupRequestResponse(req), req))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitudes del recolector", data));
    }

    @PutMapping("/api/recolector/recojos/{id}/en-ruta")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> markAsEnRuta(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        PickupRequest updated = pickupRequestService.markAsEnRuta(id, principal.getCompany(), principal.getUser(), servletRequest.getRemoteAddr());
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud marcada en ruta", ModelMapper.toPickupRequestResponse(updated)));
    }

    @PutMapping("/api/recolector/recojos/{id}/en-sitio")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> markAsEnSitio(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        PickupRequest updated = pickupRequestService.markAsEnSitio(id, principal.getCompany(), principal.getUser(), servletRequest.getRemoteAddr());
        return ResponseEntity.ok(new ApiResponse<>(true, "Llegada al sitio confirmada", ModelMapper.toPickupRequestResponse(updated)));
    }

    @PutMapping("/api/recolector/recojos/{id}/confirmar")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> confirmPickup(
            @PathVariable Long id,
            @Valid @RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupConfirmationRequest requestDto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        PickupRequest updated = pickupRequestService.confirmPickup(id, principal.getCompany(), principal.getUser(), requestDto.getVolumenReal(), requestDto.getPrecioPorLitro(), servletRequest.getRemoteAddr());
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud confirmada", ModelMapper.toPickupRequestResponse(updated)));
    }

    @GetMapping("/api/recolector/solicitudes-disponibles")
    public ResponseEntity<ApiResponse<List<PickupRequestResponse>>> getAvailableRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        java.math.BigDecimal collectorLat = principal.getCompany().getLatitude();
        java.math.BigDecimal collectorLon = principal.getCompany().getLongitude();

        List<PickupRequestResponse> data = pickupRequestService
                .getAvailableRequests(principal.getCompany()).stream()
                .map(req -> {
                    PickupRequestResponse dto = ModelMapper.toPickupRequestResponse(req);
                    if (collectorLat != null && collectorLon != null && req.getPickupLatitude() != null && req.getPickupLongitude() != null) {
                        Double distance = com.GAKOM_ECOTACNA.ECOTACNA.util.DistanceUtils.distanceKm(
                            req.getPickupLatitude(), req.getPickupLongitude(), collectorLat, collectorLon);
                        dto.setDistanceKm(distance);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
                
        // Filtrar recomendados y ordenarlos con Gemini/Score Base
        data = pickupRecommendationService.recommendAndSort(data, principal.getCompany());

        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitudes disponibles", data));
    }

    @PostMapping("/api/recolector/solicitudes/{id}/aceptar")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> acceptRequest(
            @PathVariable Long id,
            @RequestParam(required = false) java.math.BigDecimal precioPorLitro,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        PickupRequest updated = pickupRequestService.acceptRequest(id, principal.getUser(), principal.getCompany(), servletRequest.getRemoteAddr(), precioPorLitro);
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud aceptada", ModelMapper.toPickupRequestResponse(updated)));
    }

    @PostMapping("/api/recolector/solicitudes/{id}/rechazar")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) RejectRequestDto dto) {
        pickupRequestService.rejectRequest(id, principal.getCompany(), principal.getUser(), dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud rechazada exitosamente", null));
    }

    @GetMapping("/api/recolector/recojo-activo")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> getActiveRequest(
            @AuthenticationPrincipal UserPrincipal principal) {
        PickupRequest active = pickupRequestService.getActiveRequest(principal.getUser().getId());
        if (active == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "No hay recojo activo", null));
        }
        PickupRequestResponse response = ModelMapper.toPickupRequestResponse(active);
        com.GAKOM_ECOTACNA.ECOTACNA.model.User contactUser = pickupRequestService.getContactUserForCompany(active.getCompany().getId());
        if (contactUser != null) {
            String name = (contactUser.getFirstName() != null ? contactUser.getFirstName() : "") + " " + (contactUser.getLastName() != null ? contactUser.getLastName() : "");
            response.setContactoNombre(name.trim());
            response.setContactoCorreo(contactUser.getEmail());
            response.setContactoTelefono(contactUser.getPhone());
        }
        response.setEmpresaRuc(active.getCompany().getRuc());
        return ResponseEntity.ok(new ApiResponse<>(true, "Recojo activo encontrado", response));
    }

    @PostMapping("/api/empresa/solicitudes/{id}/cancelar")
    public ResponseEntity<ApiResponse<PickupRequestResponse>> cancelarSolicitud(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        PickupRequest updated = pickupRequestService.cancelarSolicitudEmpresa(id, principal.getCompany(), principal.getUser());
        return ResponseEntity.ok(new ApiResponse<>(true, "Solicitud cancelada correctamente",
                pickupRequestService.enrichPickupRequestResponse(ModelMapper.toPickupRequestResponse(updated), updated)));
    }

    @GetMapping("/api/empresa/seguimiento-activo")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse>> getActiveTrackingForCompany(
            @AuthenticationPrincipal UserPrincipal principal) {
        com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse active = pickupRequestService.getTrackingForGenerator(principal.getCompany().getId());
        if (active == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "No hay recojo activo", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Seguimiento activo", active));
    }

    @PostMapping("/api/empresa/solicitudes/{solicitudId}/confirmar-pago")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse>> confirmarPago(
            @PathVariable Long solicitudId,
            @Valid @RequestBody com.GAKOM_ECOTACNA.ECOTACNA.dto.OperationalPaymentConfirmationRequest requestDto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {
        PickupRequest updated = pickupRequestService.confirmarPago(
                solicitudId,
                principal.getCompany(),
                principal.getUser(),
                requestDto.getLitrosConfirmados(),
                requestDto.getObservacionPago(),
                servletRequest.getRemoteAddr()
        );
        com.GAKOM_ECOTACNA.ECOTACNA.dto.PickupTrackingResponse responseDto = pickupRequestService.buildTrackingResponse(updated);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pago operativo confirmado y recojo completado exitosamente", responseDto));
    }

    @GetMapping("/api/empresa/solicitudes/{id}/constancia")
    public ResponseEntity<byte[]> downloadConstanciaEmpresa(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            PickupRequest request = pickupRequestService.getConstanciaForCompany(id, principal.getCompany());
            byte[] pdf = constanciaPdfService.generateConstancia(request);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "constancia-ecotacna-solicitud-" + id + ".pdf");
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Error al generar la constancia: " + e.getMessage());
        }
    }

    @GetMapping("/api/recolector/solicitudes/{id}/constancia")
    public ResponseEntity<byte[]> downloadConstanciaRecolector(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            PickupRequest request = pickupRequestService.getConstanciaForCollector(id, principal.getUser().getId());
            byte[] pdf = constanciaPdfService.generateConstancia(request);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "constancia-recolector-ecotacna-solicitud-" + id + ".pdf");
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Error al generar la constancia: " + e.getMessage());
        }
    }
    @GetMapping("/api/empresa/solicitudes/exportar")
    public ResponseEntity<byte[]> exportarHistorialEmpresa(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<PickupRequest> requests = pickupRequestService.getRequestsForExportCompany(principal.getCompany().getId(), desde, hasta);
            byte[] excel = historialExcelService.generateCompanyExcel(requests, principal.getCompany(), desde.toString(), hasta.toString());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("filename", "historial-empresa-ecotacna-" + desde + "-" + hasta + ".xlsx");
            return new ResponseEntity<>(excel, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Error al generar Excel: " + e.getMessage());
        }
    }

    @GetMapping("/api/recolector/solicitudes/exportar")
    public ResponseEntity<byte[]> exportarHistorialRecolector(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<PickupRequest> requests = pickupRequestService.getRequestsForExportCollector(principal.getUser().getId(), desde, hasta);
            byte[] excel = historialExcelService.generateCollectorExcel(requests, principal.getUser(), desde.toString(), hasta.toString());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("filename", "historial-recolector-ecotacna-" + desde + "-" + hasta + ".xlsx");
            return new ResponseEntity<>(excel, headers, HttpStatus.OK);
        } catch (Exception e) {
            throw new com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException("Error al generar Excel: " + e.getMessage());
        }
    }
}
