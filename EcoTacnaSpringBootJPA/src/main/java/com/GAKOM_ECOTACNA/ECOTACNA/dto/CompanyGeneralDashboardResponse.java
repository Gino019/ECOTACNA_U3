package com.GAKOM_ECOTACNA.ECOTACNA.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyGeneralDashboardResponse {
    private CompanyInfo company;
    private KpisInfo kpis;
    private List<MonthlyEvolutionItem> monthlyEvolution;
    private OperationalSummary operationalSummary;
    private List<RequestDistributionItem> requestDistribution;
    private List<RecentRequestItem> recentRequests;
    private SubscriptionInfo subscription;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfo {
        private Long id;
        private String businessName;
        private String ruc;
        private String companyType;
        private String status;
        private String address;
        private String email;
        private String phone;
        private String contactPerson;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpisInfo {
        private BigDecimal totalLitersRecycled;
        private long totalRequests;
        private long completedRequests;
        private long pendingRequests;
        private BigDecimal totalPaidToCollectors;
        private boolean activeRequest;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyEvolutionItem {
        private String month;
        private BigDecimal liters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationalSummary {
        private String type;
        private String ruc;
        private String address;
        private String email;
        private String phone;
        private String status;
        private String memberSince;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestDistributionItem {
        private String label;
        private long value;
        private BigDecimal liters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentRequestItem {
        private Long id;
        private String requestDate;
        private String scheduledDate;
        private BigDecimal liters;
        private BigDecimal pricePerLiter;
        private BigDecimal totalAmount;
        private String status;
        private String paymentStatus;
        private String collectorName;
        private String collectorRuc;
        private String vehiclePlate;
        private String pickupAddress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionInfo {
        private String planName;
        private BigDecimal monthlyAmount;
        private String status;
        private LocalDate startDate;
        private LocalDate trialEndDate;
        private LocalDate endDate;
        private long daysRemaining;
        private boolean cancellationScheduled;
        private String message;
    }
}
