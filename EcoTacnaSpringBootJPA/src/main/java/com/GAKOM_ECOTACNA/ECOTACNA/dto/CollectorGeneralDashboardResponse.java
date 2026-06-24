package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectorGeneralDashboardResponse {

    private CompanyInfo company;
    private KpisInfo kpis;
    private VehicleInfo vehicle;
    private SubscriptionInfo subscription;
    private List<PerformanceItem> performance;
    private List<RecentPickupItem> recentCompletedPickups;
    private List<AvailablePickupItem> availablePickups;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CompanyInfo {
        private Long id;
        private String businessName;
        private String ruc;
        private String companyType;
        private String status;
        private String email;
        private String phone;
        private String contactPerson;
        private String address;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class KpisInfo {
        private long completedPickups;
        private long pendingPickups;
        private BigDecimal totalLitersCollected;
        private BigDecimal paymentsReceived;
        private long activeUnits;
        private String subscriptionStatus;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VehicleInfo {
        private Long id;
        private String plate;
        private String type;
        private BigDecimal capacityLiters;
        private String brand;
        private String model;
        private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubscriptionInfo {
        private String planName;
        private BigDecimal monthlyAmount;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
        private long daysRemaining;
        private boolean cancellationScheduled;
        private String message;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PerformanceItem {
        private Long pickupId;
        private BigDecimal liters;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecentPickupItem {
        private Long id;
        private String companyName;
        private LocalDate date;
        private BigDecimal liters;
        private BigDecimal pricePerLiter;
        private String status;
        private String paymentStatus;
        private BigDecimal totalAmount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AvailablePickupItem {
        private Long id;
        private String companyName;
        private String address;
        private BigDecimal estimatedLiters;
        private BigDecimal pricePerLiter;
        private LocalDate scheduledDate;
    }
}
