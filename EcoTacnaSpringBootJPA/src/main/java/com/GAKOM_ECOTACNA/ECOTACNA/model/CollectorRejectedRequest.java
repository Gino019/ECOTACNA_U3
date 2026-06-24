package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "collector_rejected_requests", indexes = {
        @Index(name = "idx_rejected_pickup", columnList = "pickup_request_id"),
        @Index(name = "idx_rejected_company", columnList = "collector_company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectorRejectedRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_request_id", nullable = false)
    private PickupRequest pickupRequest;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collector_company_id", nullable = false)
    private Company collectorCompany;

    @Column(name = "rejected_at", nullable = false, updatable = false)
    private LocalDateTime rejectedAt;

    @PrePersist
    protected void onCreate() {
        this.rejectedAt = LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
    }
}
