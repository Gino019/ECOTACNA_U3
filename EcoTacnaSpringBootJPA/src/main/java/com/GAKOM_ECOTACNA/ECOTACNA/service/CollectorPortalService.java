package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.CollectorGeneralDashboardResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ResourceNotFoundException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PickupRequestRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.TransportUnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CollectorPortalService {

    private final PickupRequestRepository pickupRequestRepository;
    private final TransportUnitRepository transportUnitRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Autowired
    public CollectorPortalService(PickupRequestRepository pickupRequestRepository,
                                  TransportUnitRepository transportUnitRepository,
                                  SubscriptionRepository subscriptionRepository) {
        this.pickupRequestRepository = pickupRequestRepository;
        this.transportUnitRepository = transportUnitRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(User collector) {
        if (collector.getCompany() == null) {
            throw new ResourceNotFoundException("Recolector sin empresa asociada.");
        }
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", collector.getId());
        profile.put("correo", collector.getEmail());
        profile.put("rol", collector.getRole().name());
        profile.put("companyId", collector.getCompany().getId());
        profile.put("razonSocial", collector.getCompany().getBusinessName());
        profile.put("ruc", collector.getCompany().getRuc());
        profile.put("tipoEmpresa", collector.getCompany().getCompanyType().name());
        profile.put("direccion", collector.getCompany().getAddress());
        profile.put("estado", collector.getCompany().getSubscriptionStatus() != null
                ? collector.getCompany().getSubscriptionStatus().name() : "DESCONOCIDO");
                
        String contactName = (collector.getFirstName() != null ? collector.getFirstName() : "") + 
                             (collector.getLastName() != null ? " " + collector.getLastName() : "");
        profile.put("personaContacto", contactName.trim());
        profile.put("telefono", collector.getPhone());
        return profile;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary(Long collectorUserId) {
        List<PickupRequest> recojos =
                pickupRequestRepository.findByCollectorUserId(collectorUserId);
        long total = recojos.size();
        long completadas = recojos.stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.COMPLETADO || r.getStatus() == PickupRequestStatus.RECOGIDO)
                .count();
        long enRuta = recojos.stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.EN_RUTA || r.getStatus() == PickupRequestStatus.PROGRAMADO)
                .count();
        double litrosHistorico = recojos.stream()
                .filter(r -> r.getActualVolumeLiters() != null)
                .mapToDouble(r -> r.getActualVolumeLiters().doubleValue())
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("total_recojos", total);
        summary.put("recojosPendientes", enRuta);
        summary.put("completadas", completadas);
        summary.put("litrosRecolectadosHistorico", litrosHistorico);
        return summary;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(User collector) {
        if (collector.getCompany() == null) {
            throw new ResourceNotFoundException("Recolector sin empresa asociada.");
        }
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("companyId", collector.getCompany().getId());
        dashboard.put("ruc", collector.getCompany().getRuc());
        dashboard.put("razonSocial", collector.getCompany().getBusinessName());
        dashboard.put("tipoEmpresa", collector.getCompany().getCompanyType().name());
        dashboard.put("correo", collector.getEmail());
        dashboard.put("telefono", collector.getPhone());
        dashboard.put("estado", collector.getCompany().getSubscriptionStatus() != null
                ? collector.getCompany().getSubscriptionStatus().name() : "DESCONOCIDO");
        dashboard.put("subscriptionStatus", collector.getCompany().getSubscriptionStatus() != null
                ? collector.getCompany().getSubscriptionStatus().name() : "DESCONOCIDO");

        List<PickupRequest> recojos =
                pickupRequestRepository.findByCollectorUserId(collector.getId());
        long pending = recojos.stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.EN_RUTA || r.getStatus() == PickupRequestStatus.PROGRAMADO)
                .count();
        long accepted = recojos.size();
        double liters = recojos.stream()
                .filter(r -> r.getActualVolumeLiters() != null)
                .mapToDouble(r -> r.getActualVolumeLiters().doubleValue())
                .sum();

        dashboard.put("recojosPendientes", pending);
        dashboard.put("recojosVinculados", accepted);
        dashboard.put("litrosAcumulados", liters);
        dashboard.put("solicitudesAceptadas", accepted);
        dashboard.put("solicitudesAceptadasDetalle", List.of());
        dashboard.put("recojosDelDia", List.of());
        return dashboard;
    }

    @Transactional(readOnly = true)
    public CollectorGeneralDashboardResponse getDashboardGeneral(User collector) {
        if (collector.getCompany() == null) {
            throw new ResourceNotFoundException("Recolector sin empresa asociada.");
        }
        Company company = collector.getCompany();

        // --- Company Info ---
        String contactName = ((collector.getFirstName() != null ? collector.getFirstName() : "") +
                (collector.getLastName() != null ? " " + collector.getLastName() : "")).trim();
        CollectorGeneralDashboardResponse.CompanyInfo companyInfo = CollectorGeneralDashboardResponse.CompanyInfo.builder()
                .id(company.getId())
                .businessName(company.getBusinessName())
                .ruc(company.getRuc())
                .companyType(company.getCompanyType().name())
                .status(company.getSubscriptionStatus() != null ? company.getSubscriptionStatus().name() : "DESCONOCIDO")
                .email(collector.getEmail())
                .phone(collector.getPhone())
                .contactPerson(contactName.isEmpty() ? null : contactName)
                .address(company.getAddress())
                .build();

        // --- Recojos del recolector ---
        List<PickupRequest> allRecojos = pickupRequestRepository.findByCollectorUserId(collector.getId());

        List<PickupRequest> completed = allRecojos.stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.COMPLETADO)
                .collect(Collectors.toList());

        List<PickupRequest> pendingList = allRecojos.stream()
                .filter(r -> r.getStatus() == PickupRequestStatus.PROGRAMADO
                        || r.getStatus() == PickupRequestStatus.EN_RUTA)
                .collect(Collectors.toList());

        BigDecimal totalLiters = completed.stream()
                .map(r -> r.getLitrosConfirmados() != null ? r.getLitrosConfirmados()
                        : (r.getActualVolumeLiters() != null ? r.getActualVolumeLiters() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPayments = completed.stream()
                .filter(r -> "PAGADO".equalsIgnoreCase(r.getEstadoPago()))
                .map(r -> {
                    if (r.getMontoTotal() != null) return r.getMontoTotal();
                    BigDecimal liters = r.getLitrosConfirmados() != null ? r.getLitrosConfirmados() : BigDecimal.ZERO;
                    BigDecimal price = r.getPrecioPorLitro() != null ? r.getPrecioPorLitro() : BigDecimal.ZERO;
                    return liters.multiply(price);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // --- Vehicle ---
        List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(company.getId());
        long activeUnits = units.stream().filter(u -> u.getStatus() == TransportStatus.ACTIVO).count();
        CollectorGeneralDashboardResponse.VehicleInfo vehicleInfo = null;
        if (!units.isEmpty()) {
            TransportUnit u = units.get(0);
            vehicleInfo = CollectorGeneralDashboardResponse.VehicleInfo.builder()
                    .id(u.getId())
                    .plate(u.getPlate())
                    .type(u.getUnitType())
                    .capacityLiters(u.getCapacityLiters())
                    .brand(u.getBrand())
                    .model(u.getModel())
                    .status(u.getStatus() != null ? u.getStatus().name() : "DESCONOCIDO")
                    .build();
        }

        // --- KPIs ---
        CollectorGeneralDashboardResponse.KpisInfo kpis = CollectorGeneralDashboardResponse.KpisInfo.builder()
                .completedPickups(completed.size())
                .pendingPickups(pendingList.size())
                .totalLitersCollected(totalLiters)
                .paymentsReceived(totalPayments)
                .activeUnits(activeUnits)
                .subscriptionStatus(company.getSubscriptionStatus() != null ? company.getSubscriptionStatus().name() : "DESCONOCIDO")
                .build();

        // --- Subscription ---
        CollectorGeneralDashboardResponse.SubscriptionInfo subscriptionInfo = buildSubscriptionInfo(company);

        // --- Performance (last 5 completed, ordered asc for chart) ---
        List<CollectorGeneralDashboardResponse.PerformanceItem> performance = completed.stream()
                .sorted(Comparator.comparing(PickupRequest::getCollectedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .sorted(Comparator.comparing(PickupRequest::getCollectedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(r -> CollectorGeneralDashboardResponse.PerformanceItem.builder()
                        .pickupId(r.getId())
                        .liters(r.getLitrosConfirmados() != null ? r.getLitrosConfirmados()
                                : (r.getActualVolumeLiters() != null ? r.getActualVolumeLiters() : BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        // --- Recent completed pickups ---
        List<CollectorGeneralDashboardResponse.RecentPickupItem> recentPickups = completed.stream()
                .sorted(Comparator.comparing(PickupRequest::getCollectedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(r -> CollectorGeneralDashboardResponse.RecentPickupItem.builder()
                        .id(r.getId())
                        .companyName(r.getCompany() != null ? r.getCompany().getBusinessName() : "No registrado")
                        .date(r.getCollectedAt() != null ? r.getCollectedAt().toLocalDate() : null)
                        .liters(r.getLitrosConfirmados() != null ? r.getLitrosConfirmados() : r.getActualVolumeLiters())
                        .pricePerLiter(r.getPrecioPorLitro())
                        .status(r.getStatus().name())
                        .paymentStatus(r.getEstadoPago() != null ? r.getEstadoPago() : "PENDIENTE")
                        .totalAmount(r.getMontoTotal())
                        .build())
                .collect(Collectors.toList());

        // --- Available pickups ---
        List<CollectorGeneralDashboardResponse.AvailablePickupItem> availablePickups;
        try {
            List<PickupRequest> available = pickupRequestRepository.findAvailableRequests(company.getId(), PickupRequestStatus.PENDIENTE);
            availablePickups = available.stream()
                    .limit(5)
                    .map(r -> CollectorGeneralDashboardResponse.AvailablePickupItem.builder()
                            .id(r.getId())
                            .companyName(r.getCompany() != null ? r.getCompany().getBusinessName() : "No registrado")
                            .address(r.getDireccion())
                            .estimatedLiters(r.getApproximateVolumeLiters())
                            .pricePerLiter(r.getPrecioOfertadoPorLitro())
                            .scheduledDate(r.getScheduledAt() != null ? r.getScheduledAt().toLocalDate() : null)
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            availablePickups = List.of();
        }

        return CollectorGeneralDashboardResponse.builder()
                .company(companyInfo)
                .kpis(kpis)
                .vehicle(vehicleInfo)
                .subscription(subscriptionInfo)
                .performance(performance)
                .recentCompletedPickups(recentPickups)
                .availablePickups(availablePickups)
                .build();
    }

    private CollectorGeneralDashboardResponse.SubscriptionInfo buildSubscriptionInfo(Company company) {
        Optional<Subscription> subOpt = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId());

        if (subOpt.isEmpty()) {
            return CollectorGeneralDashboardResponse.SubscriptionInfo.builder()
                    .planName("Sin suscripción")
                    .monthlyAmount(new BigDecimal("299.90"))
                    .status("SIN_SUSCRIPCION")
                    .daysRemaining(0)
                    .cancellationScheduled(false)
                    .message("No tienes una suscripción activa. Activa tu plan para operar.")
                    .build();
        }

        Subscription sub = subOpt.get();
        SubscriptionPlan plan = sub.getPlan();

        LocalDate startDate = sub.getCurrentPeriodStart() != null ? sub.getCurrentPeriodStart() : (sub.getStartDate() != null ? sub.getStartDate() : null);
        LocalDate endDate = sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : null;
        long daysRemaining = 0;
        if (endDate != null) {
            daysRemaining = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), endDate));
        }

        boolean cancelScheduled = sub.getScheduledCancellation() != null && sub.getScheduledCancellation();

        String message;
        String statusStr = sub.getStatus() != null ? sub.getStatus().name() : "DESCONOCIDO";
        if (cancelScheduled && endDate != null) {
            message = "Tu cancelación fue programada. Mantendrás acceso hasta el " + 
                      String.format("%02d/%02d/%d", endDate.getDayOfMonth(), endDate.getMonthValue(), endDate.getYear()) + ".";
        } else if ("ACTIVA".equals(statusStr)) {
            message = "Tu suscripción está activa.";
        } else if ("TRIAL".equals(statusStr) || "PRUEBA".equals(statusStr)) {
            message = "Estás en período de prueba gratuita.";
        } else {
            message = "Estado de suscripción: " + statusStr;
        }

        return CollectorGeneralDashboardResponse.SubscriptionInfo.builder()
                .planName(plan != null ? plan.getName() : "Plan Recolector Pro")
                .monthlyAmount(plan != null ? plan.getMonthlyAmount() : new BigDecimal("299.90"))
                .status(statusStr)
                .startDate(startDate)
                .endDate(endDate)
                .daysRemaining(daysRemaining)
                .cancellationScheduled(cancelScheduled)
                .message(message)
                .build();
    }
}
