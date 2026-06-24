package com.GAKOM_ECOTACNA.ECOTACNA.controller;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AuditLogResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.mapper.ModelMapper;
import com.GAKOM_ECOTACNA.ECOTACNA.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Autowired
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Retorna la bitácora completa de auditoría global (Solo Administradores).
     */
    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllLogs() {
        List<AuditLogResponse> logs = auditLogService.getAllLogs().stream()
                .map(ModelMapper::toAuditLogResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }
}
