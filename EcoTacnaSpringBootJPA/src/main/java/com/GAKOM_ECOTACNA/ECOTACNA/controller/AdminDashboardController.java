package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.ApiResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @Autowired
    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/resumen")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumen() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Resumen administrativo",
                adminDashboardService.getResumen()));
    }

    @GetMapping("/resumen-institucional")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumenInstitucional() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Resumen institucional",
                adminDashboardService.getResumenInstitucional()));
    }

    @GetMapping("/empresas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> empresas() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Empresas registradas",
                adminDashboardService.getEmpresas()));
    }



    @GetMapping("/empresas/rechazadas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> empresasRechazadas() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Empresas rechazadas",
                adminDashboardService.getEmpresasRechazadas()));
    }

    @GetMapping("/recolectores")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> recolectores() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Empresas recolectoras",
                adminDashboardService.getEmpresasRecolectoras()));
    }

    @PostMapping("/empresas/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveCompany(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.approveCompany(id));
    }

    @PostMapping("/empresas/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectCompany(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.rejectCompany(id));
    }

    @PostMapping("/empresas/{id}/admitir")
    public ResponseEntity<Map<String, Object>> admitCompany(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.readmitCompany(id));
    }

    @PostMapping("/recolectores/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveRecolectora(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.approveCompany(id));
    }

    @PostMapping("/recolectores/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectRecolectora(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.rejectCompany(id));
    }

    @Autowired
    private org.springframework.context.ApplicationContext applicationContext;

    @GetMapping("/empresas/{id}/detalle")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse>> getEmpresaDetalle(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Detalle de empresa obtenido",
                adminDashboardService.getEmpresaDetalle(id)));
    }

    @GetMapping("/empresas/{id}/ficha-pdf")
    public ResponseEntity<byte[]> getEmpresaFichaPdf(@PathVariable Long id) {
        com.GAKOM_ECOTACNA.ECOTACNA.service.AdminPdfService pdfService = applicationContext.getBean(com.GAKOM_ECOTACNA.ECOTACNA.service.AdminPdfService.class);
        byte[] pdfBytes = pdfService.generarFichaPdf(id);

        com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse detalle = adminDashboardService.getEmpresaDetalle(id);
        String ruc = detalle.getRuc() != null ? detalle.getRuc() : id.toString();

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ficha_empresa_" + ruc + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping("/recolectores/{id}/detalle")
    public ResponseEntity<ApiResponse<com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse>> getRecolectoraDetalle(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Detalle de recolectora obtenido",
                adminDashboardService.getEmpresaDetalle(id)));
    }

    @GetMapping("/recolectores/{id}/ficha-pdf")
    public ResponseEntity<byte[]> getRecolectoraFichaPdf(@PathVariable Long id) {
        com.GAKOM_ECOTACNA.ECOTACNA.service.AdminPdfService pdfService = applicationContext.getBean(com.GAKOM_ECOTACNA.ECOTACNA.service.AdminPdfService.class);
        byte[] pdfBytes = pdfService.generarFichaPdf(id);

        com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse detalle = adminDashboardService.getEmpresaDetalle(id);
        String ruc = detalle.getRuc() != null ? detalle.getRuc() : id.toString();

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ficha_recolectora_" + ruc + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }
}
