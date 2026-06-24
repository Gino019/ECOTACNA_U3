package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Nullable if triggered by an anonymous user or system failure

    @NotNull
    @Column(nullable = false, length = 150)
    private String email;

    @NotNull
    @Column(nullable = false, length = 100)
    private String action; // E.g., "SOLICITUD_CREADA", "EMPRESA_REGISTRADA"

    @NotNull
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @NotNull
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
