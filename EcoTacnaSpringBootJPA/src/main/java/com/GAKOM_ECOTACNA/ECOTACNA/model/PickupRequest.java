package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_requests", indexes = {
        @Index(name = "idx_pickup_requests_status", columnList = "status"),
        @Index(name = "idx_pickup_requests_company", columnList = "company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @NotNull
    @Column(name = "approximate_volume_liters", nullable = false, precision = 12, scale = 2)
    private BigDecimal approximateVolumeLiters;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PickupRequestStatus status = PickupRequestStatus.PENDIENTE;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "collector_user_id")
    private Long collectorUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transport_unit_id")
    private TransportUnit transportUnit;

    @Column(name = "actual_volume_liters", precision = 12, scale = 2)
    private BigDecimal actualVolumeLiters;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Column(columnDefinition = "TEXT")
    private String direccion;

    @Column(name = "evidencia_url", columnDefinition = "TEXT")
    private String evidenciaUrl;

    @Column(name = "pickup_latitude", precision = 10, scale = 7)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", precision = 10, scale = 7)
    private BigDecimal pickupLongitude;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "precio_ofertado_por_litro", precision = 12, scale = 2)
    private BigDecimal precioOfertadoPorLitro;

    @Column(name = "litros_confirmados", precision = 12, scale = 2)
    private BigDecimal litrosConfirmados;

    @Column(name = "precio_por_litro", precision = 12, scale = 2)
    private BigDecimal precioPorLitro;

    @Column(name = "monto_total", precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "estado_pago", length = 30)
    private String estadoPago;

    @Column(name = "fecha_confirmacion_pago")
    private LocalDateTime fechaConfirmacionPago;

    @Column(name = "observacion_pago", columnDefinition = "TEXT")
    private String observacionPago;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
        this.requestedAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
    }
}
