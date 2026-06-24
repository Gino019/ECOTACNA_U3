package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.model.AuditLog;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Registra un evento de auditoría.
     * Se usa la misma transacción para evitar violaciones de clave foránea con entidades recién creadas.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void log(User user, String email, String action, String details, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .email(email != null ? email : "anonymous@eco-tacna.com")
                .action(action)
                .details(details)
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
