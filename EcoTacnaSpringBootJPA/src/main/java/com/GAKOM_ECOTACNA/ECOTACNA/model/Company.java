package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies", indexes = {
    @Index(name = "idx_companies_ruc", columnList = "ruc")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 11, max = 11, message = "El RUC debe tener exactamente 11 dígitos")
    @Column(unique = true, nullable = false, length = 11)
    private String ruc;

    @NotNull
    @Size(max = 255)
    @Column(name = "business_name", nullable = false)
    private String businessName;

    @NotNull
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String address;

    @Size(max = 100)
    @Column(length = 100)
    private String district;

    @Size(max = 100)
    @Column(length = 100)
    private String province;

    @Size(max = 100)
    @Column(length = 100)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "company_type", nullable = false, length = 30)
    private CompanyType companyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false, length = 30)
    @Builder.Default
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.PENDIENTE;

    @Column(name = "latitude", precision = 10, scale = 7)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private java.math.BigDecimal longitude;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private java.util.List<CompanyBranch> branches;

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
