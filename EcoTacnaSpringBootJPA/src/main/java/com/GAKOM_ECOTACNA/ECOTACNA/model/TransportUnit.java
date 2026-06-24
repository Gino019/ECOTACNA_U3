package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_units", indexes = {
        @Index(name = "idx_transport_units_company", columnList = "collector_company_id"),
        @Index(name = "idx_transport_units_plate", columnList = "plate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collector_company_id", nullable = false)
    private Company collectorCompany;

    @NotNull
    @Column(nullable = false, unique = true, length = 12)
    private String plate;

    @Column(length = 60)
    private String brand;

    @Column(length = 60)
    private String model;

    @NotNull
    @Column(name = "capacity_liters", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityLiters;

    @Column(name = "unit_type", length = 50)
    private String unitType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TransportStatus status = TransportStatus.ACTIVO;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "last_latitude", precision = 10, scale = 7)
    private BigDecimal lastLatitude;

    @Column(name = "last_longitude", precision = 10, scale = 7)
    private BigDecimal lastLongitude;

    @Column(name = "last_location_at")
    private LocalDateTime lastLocationAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.plate != null) {
            this.plate = this.plate.trim().toUpperCase();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.plate != null) {
            this.plate = this.plate.trim().toUpperCase();
        }
    }
}
