package com.GAKOM_ECOTACNA.ECOTACNA.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SubscriptionStatus status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "trial_ends_at")
    private LocalDate trialEndsAt;

    @Column(name = "current_period_start")
    private LocalDate currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDate currentPeriodEnd;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;

    @Column(length = 50)
    private String provider;

    @Column(name = "provider_customer_id", length = 100)
    private String providerCustomerId;

    @Column(name = "provider_card_id", length = 100)
    private String providerCardId;

    @Column(name = "provider_subscription_id", length = 100)
    private String providerSubscriptionId;

    @Column(name = "scheduled_cancellation", nullable = false)
    @Builder.Default
    private Boolean scheduledCancellation = false;

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
