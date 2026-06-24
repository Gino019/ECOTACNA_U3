package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_request_incidents", indexes = {
    @Index(name = "idx_pickup_request_incidents_request", columnList = "pickup_request_id"),
    @Index(name = "idx_pickup_request_incidents_company", columnList = "reporter_company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickupRequestIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_request_id", nullable = false)
    private PickupRequest pickupRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_company_id", nullable = false)
    private Company reporterCompany;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporterUser;

    @Column(name = "reason_code", nullable = false, length = 80)
    private String reasonCode;

    @Column(name = "reason_label", nullable = false, length = 150)
    private String reasonLabel;

    @Column(name = "custom_reason", length = 255)
    private String customReason;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "REGISTRADA";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
