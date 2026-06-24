package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final TransportUnitRepository transportUnitRepository;

    @Autowired
    public AdminDashboardService(CompanyRepository companyRepository,
            UserRepository userRepository,
            PickupRequestRepository pickupRequestRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentRepository paymentRepository,
            TransportUnitRepository transportUnitRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.pickupRequestRepository = pickupRequestRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.transportUnitRepository = transportUnitRepository;
    }

    @Transactional(readOnly = true)
    public com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse getEmpresaDetalle(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada con ID: " + companyId));

        com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse response = new com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse();
        response.setCompanyId(company.getId());
        response.setBusinessName(company.getBusinessName());
        response.setRuc(company.getRuc());
        response.setCompanyType(company.getCompanyType() != null ? company.getCompanyType().name() : "Desconocido");
        response.setSubscriptionStatus(company.getSubscriptionStatus() != null ? company.getSubscriptionStatus().name() : "Desconocido");
        response.setAddress(company.getAddress() != null ? company.getAddress() : "No registrado");
        response.setDistrict(company.getDistrict() != null ? company.getDistrict() : "No registrado");
        response.setProvince(company.getProvince() != null ? company.getProvince() : "No registrado");
        response.setDepartment(company.getDepartment() != null ? company.getDepartment() : "No registrado");

        List<User> users = userRepository.findByCompanyId(company.getId());
        if (!users.isEmpty()) {
            User u = users.get(0);
            response.setContactName((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
            response.setContactEmail(u.getEmail() != null ? u.getEmail() : "No registrado");
            
            String phone = u.getPhone();
            if (phone != null && !phone.isBlank()) {
                String digits = phone.replaceAll("[^0-9]", "");
                if (digits.length() == 9) {
                    response.setContactPhone("+51 " + digits.substring(0,3) + " " + digits.substring(3,6) + " " + digits.substring(6));
                } else if (digits.length() == 11 && digits.startsWith("51")) {
                    response.setContactPhone("+51 " + digits.substring(2,5) + " " + digits.substring(5,8) + " " + digits.substring(8));
                } else {
                    response.setContactPhone(phone);
                }
            } else {
                response.setContactPhone("No registrado");
            }
            response.setRegistrationDate(u.getCreatedAt() != null ? u.getCreatedAt() : company.getCreatedAt());
        } else {
            response.setContactName("No registrado");
            response.setContactEmail("No registrado");
            response.setContactPhone("No registrado");
            response.setRegistrationDate(company.getCreatedAt());
        }

        List<Subscription> subs = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId()).stream().toList();
        
        java.math.BigDecimal defaultAmount = company.getCompanyType() == CompanyType.RECOLECTORA ? 
                new java.math.BigDecimal("299.90") : new java.math.BigDecimal("29.90");
        String defaultPlanName = company.getCompanyType() == CompanyType.RECOLECTORA ? 
                "Plan Recolector Pro" : "Plan Generador Básico";

        if (!subs.isEmpty()) {
            Subscription s = subs.get(0);
            response.setPlanName(s.getPlan() != null ? s.getPlan().getName() : defaultPlanName);
            response.setMonthlyAmount(s.getPlan() != null && s.getPlan().getMonthlyAmount() != null ? 
                    s.getPlan().getMonthlyAmount() : defaultAmount);
            response.setStartDate(s.getStartDate() != null ? s.getStartDate().atStartOfDay() : null);
            response.setCurrentPeriodEnd(s.getCurrentPeriodEnd() != null ? s.getCurrentPeriodEnd().atStartOfDay() : null);
        } else {
            if (company.getSubscriptionStatus() != null && 
                (company.getSubscriptionStatus() == SubscriptionStatus.ACTIVA || 
                 company.getSubscriptionStatus() == SubscriptionStatus.PRUEBA_ACTIVA || 
                 company.getSubscriptionStatus() == SubscriptionStatus.PENDIENTE_PAGO)) {
                response.setPlanName(defaultPlanName);
                response.setMonthlyAmount(defaultAmount);
            } else {
                response.setPlanName("Sin suscripción");
                response.setMonthlyAmount(defaultAmount); // Show price they would pay
            }
        }

        List<Payment> payments = paymentRepository.findByCompanyIdOrderByCreatedAtDesc(company.getId());
        if (!payments.isEmpty()) {
            Payment p = payments.get(0);
            response.setLastPaymentAmount(p.getAmount());
            response.setLastPaymentDate(p.getCreatedAt());
        }

        List<PickupRequest> requests;
        if (company.getCompanyType() == CompanyType.RECOLECTORA) {
            requests = pickupRequestRepository.findByCollectorCompanyIdOrderByRequestedAtDesc(company.getId());
        } else {
            requests = pickupRequestRepository.findByCompanyIdOrderByRequestedAtDesc(company.getId());
        }
        
        response.setTotalRequests(requests.size());
        
        double totalLiters = 0;
        java.time.LocalDateTime lastActivity = null;
        for (PickupRequest req : requests) {
            if (req.getStatus() == PickupRequestStatus.COMPLETADO || req.getStatus() == PickupRequestStatus.RECOGIDO) {
                if (req.getLitrosConfirmados() != null) {
                    totalLiters += req.getLitrosConfirmados().doubleValue();
                } else if (req.getActualVolumeLiters() != null) {
                    totalLiters += req.getActualVolumeLiters().doubleValue();
                } else if (req.getApproximateVolumeLiters() != null) {
                    totalLiters += req.getApproximateVolumeLiters().doubleValue();
                }
            }
            if (lastActivity == null || (req.getRequestedAt() != null && req.getRequestedAt().isAfter(lastActivity))) {
                lastActivity = req.getRequestedAt();
            }
        }
        response.setTotalLitersCollected(totalLiters);
        response.setLastActivityDate(lastActivity);

        if (company.getCompanyType() == CompanyType.RECOLECTORA) {
            List<TransportUnit> units = transportUnitRepository.findByCollectorCompanyIdOrderByCreatedAtDesc(company.getId());
            List<com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminVehicleDto> vehicleDtos = units.stream().map(u -> 
                com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminVehicleDto.builder()
                    .plate(u.getPlate())
                    .unitType(u.getUnitType())
                    .capacityLiters(u.getCapacityLiters())
                    .status(u.getStatus() != null ? u.getStatus().name() : "Desconocido")
                    .brand(u.getBrand())
                    .model(u.getModel())
                    .registrationDate(u.getCreatedAt())
                    .build()
            ).collect(Collectors.toList());
            response.setVehicles(vehicleDtos);
        } else {
            response.setVehicles(java.util.Collections.emptyList());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getResumen() {
        Map<String, Object> resumen = new HashMap<>();
        resumen.put("totalEmpresas", companyRepository.count());
        resumen.put("totalUsuarios", userRepository.count());
        resumen.put("totalSolicitudes", pickupRequestRepository.count());
        resumen.put("solicitudesPendientes",
                pickupRequestRepository.countByStatus(PickupRequestStatus.PENDIENTE));
        return resumen;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getResumenInstitucional() {
        Map<String, Object> data = new HashMap<>();

        java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
        java.time.LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        // 1. ingresosDelMes (pagos confirmados mes actual)
        java.math.BigDecimal ingresosDelMes = paymentRepository.sumPaymentsByStatusSince(PaymentStatus.APROBADO, startOfMonth);
        data.put("ingresosDelMes", ingresosDelMes != null ? ingresosDelMes : java.math.BigDecimal.ZERO);

        // 2. suscripcionesActivas
        long suscripcionesActivas = companyRepository.countBySubscriptionStatus(SubscriptionStatus.ACTIVA);
        data.put("suscripcionesActivas", suscripcionesActivas);

        // 3 y 4. cobrosProximos (vencen en los próximos 7 días) y montoPorCobrar
        java.time.LocalDate today = now.toLocalDate();
        java.time.LocalDate in7Days = today.plusDays(7);
        List<SubscriptionStatus> activeStatuses = java.util.Arrays.asList(SubscriptionStatus.ACTIVA, SubscriptionStatus.PRUEBA_ACTIVA);
        List<Subscription> upcoming = subscriptionRepository.findUpcomingCharges(activeStatuses, today, in7Days);
        
        data.put("cobrosProximos", upcoming.size());
        
        java.math.BigDecimal montoPorCobrar = java.math.BigDecimal.ZERO;
        List<Map<String, Object>> proximosCobros = new java.util.ArrayList<>();
        
        for (Subscription sub : upcoming) {
            java.math.BigDecimal subAmount = (sub.getCompany().getCompanyType() == CompanyType.RECOLECTORA) 
                    ? new java.math.BigDecimal("299.90") 
                    : new java.math.BigDecimal("29.90");
            montoPorCobrar = montoPorCobrar.add(subAmount);
            
            if (proximosCobros.size() < 10) {
                Map<String, Object> p = new HashMap<>();
                p.put("empresa", sub.getCompany().getBusinessName());
                p.put("monto", subAmount);
                p.put("fechaVencimiento", sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : "N/A");
                p.put("tipo", sub.getCompany().getCompanyType().name() != null ? sub.getCompany().getCompanyType().name() : "Desconocido");
                proximosCobros.add(p);
            }
        }
        data.put("montoPorCobrar", montoPorCobrar);
        data.put("proximosCobros", proximosCobros);

        // 5. pagosAceite (suma de montos en recojos PAGADOS)
        java.math.BigDecimal pagosAceite = pickupRequestRepository.sumMontoTotalPagado();
        data.put("pagosAceite", pagosAceite != null ? pagosAceite : java.math.BigDecimal.ZERO);

        // 6. litrosComercializados
        java.math.BigDecimal litros = pickupRequestRepository.sumLitrosConfirmados(PickupRequestStatus.COMPLETADO);
        data.put("litrosComercializados", litros != null ? litros : java.math.BigDecimal.ZERO);

        // 7. ingresosMensuales (6 meses atrás)
        List<Map<String, Object>> ingresosMensuales = new java.util.ArrayList<>();
        String[] nombresMeses = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDateTime start = startOfMonth.minusMonths(i);
            java.time.LocalDateTime end = start.plusMonths(1);
            java.math.BigDecimal m = paymentRepository.sumPaymentsByStatusBetween(PaymentStatus.APROBADO, start, end);
            Map<String, Object> mesData = new HashMap<>();
            mesData.put("mes", nombresMeses[start.getMonthValue() - 1]);
            mesData.put("monto", m != null ? m : java.math.BigDecimal.ZERO);
            ingresosMensuales.add(mesData);
        }
        data.put("ingresosMensuales", ingresosMensuales);

        // 8. composicionIngresos
        Map<String, Object> comp = new HashMap<>();
        long totalGen = companyRepository.findByCompanyTypeOrderByCreatedAtDesc(CompanyType.GENERADORA).stream()
            .filter(c -> c.getSubscriptionStatus() == SubscriptionStatus.ACTIVA).count();
        long totalRec = companyRepository.findByCompanyTypeOrderByCreatedAtDesc(CompanyType.RECOLECTORA).stream()
            .filter(c -> c.getSubscriptionStatus() == SubscriptionStatus.ACTIVA).count();
        
        java.math.BigDecimal gen = new java.math.BigDecimal("29.90").multiply(new java.math.BigDecimal(totalGen));
        java.math.BigDecimal rec = new java.math.BigDecimal("299.90").multiply(new java.math.BigDecimal(totalRec));
        comp.put("suscripcionesGeneradoras", gen);
        comp.put("suscripcionesRecolectoras", rec);
        comp.put("pagosAceite", pagosAceite != null ? pagosAceite : java.math.BigDecimal.ZERO);
        data.put("composicionIngresos", comp);

        // 9. estadoSuscripciones
        Map<String, Object> est = new HashMap<>();
        est.put("activas", companyRepository.countBySubscriptionStatus(SubscriptionStatus.ACTIVA));
        est.put("pruebaActiva", companyRepository.countBySubscriptionStatus(SubscriptionStatus.PRUEBA_ACTIVA));
        est.put("pendientePago", companyRepository.countBySubscriptionStatus(SubscriptionStatus.PENDIENTE_PAGO));
        est.put("pendiente", companyRepository.countBySubscriptionStatus(SubscriptionStatus.PENDIENTE));
        est.put("canceladas", companyRepository.countBySubscriptionStatus(SubscriptionStatus.CANCELADA));
        data.put("estadoSuscripciones", est);

        return data;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmpresas() {
        // Solo retorna empresas GENERADORAS
        return companyRepository.findByCompanyTypeOrderByCreatedAtDesc(CompanyType.GENERADORA)
                .stream()
                .map(c -> buildCompanyMap(c))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmpresasRechazadas() {
        return companyRepository.findByCompanyTypeOrderByCreatedAtDesc(CompanyType.GENERADORA)
                .stream()
                .filter(c -> c.getSubscriptionStatus() == SubscriptionStatus.CANCELADA)
                .map(this::buildCompanyMap)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEmpresasRecolectoras() {
        // Solo retorna empresas RECOLECTORAS
        return companyRepository.findByCompanyTypeOrderByCreatedAtDesc(CompanyType.RECOLECTORA)
                .stream()
                .map(c -> buildCompanyMap(c))
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildCompanyMap(Company c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("ruc", c.getRuc());
        m.put("razonSocial", c.getBusinessName());
        m.put("tipoEmpresa", c.getCompanyType().name());
        m.put("direccion", c.getAddress());
        String correoContacto = null;
        String numeroContacto = null;
        List<User> users = userRepository.findByCompanyId(c.getId());
        if (!users.isEmpty()) {
            User u = users.get(0);
            if (u.getEmail() != null) correoContacto = u.getEmail();
            if (u.getPhone() != null && !u.getPhone().isBlank()) numeroContacto = u.getPhone();
        }
        m.put("correoContacto", correoContacto != null ? correoContacto : "Información no disponible");
        m.put("numeroContacto", numeroContacto != null ? numeroContacto : "Información no disponible");
        m.put("totalLiters", 0);
        m.put("estado", c.getSubscriptionStatus() != null ? c.getSubscriptionStatus().name() : "PENDIENTE");
        return m;
    }

    @Transactional
    public Map<String, Object> approveCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada con ID: " + companyId));

        if (company.getSubscriptionStatus() != SubscriptionStatus.PENDIENTE) {
            throw new BusinessException("La empresa no está pendiente de aprobación.");
        }

        company.setSubscriptionStatus(SubscriptionStatus.PENDIENTE_PAGO);
        companyRepository.save(company);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("companyId", company.getId());
        response.put("ruc", company.getRuc());
        response.put("razonSocial", company.getBusinessName());
        response.put("estado", company.getSubscriptionStatus().name());
        response.put("nextStep", "PAYMENT_PENDING");
        response.put("message", "Empresa aprobada correctamente.");
        return response;
    }

    @Transactional
    public Map<String, Object> rejectCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada con ID: " + companyId));

        if (company.getSubscriptionStatus() != SubscriptionStatus.PENDIENTE) {
            throw new BusinessException("La empresa no está pendiente de aprobación.");
        }

        company.setSubscriptionStatus(SubscriptionStatus.CANCELADA);
        companyRepository.save(company);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("companyId", company.getId());
        response.put("ruc", company.getRuc());
        response.put("razonSocial", company.getBusinessName());
        response.put("estado", company.getSubscriptionStatus().name());
        response.put("nextStep", "REJECTED");
        response.put("message", "Empresa rechazada correctamente.");
        return response;
    }
    @Transactional
    public Map<String, Object> readmitCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada con ID: " + companyId));

        if (company.getSubscriptionStatus() != SubscriptionStatus.CANCELADA) {
            throw new BusinessException("La empresa no está cancelada/rechazada.");
        }

        company.setSubscriptionStatus(SubscriptionStatus.PENDIENTE_PAGO);
        companyRepository.save(company);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("companyId", company.getId());
        response.put("ruc", company.getRuc());
        response.put("razonSocial", company.getBusinessName());
        response.put("estado", company.getSubscriptionStatus().name());
        response.put("nextStep", "PAYMENT_PENDING");
        response.put("message", "Empresa readmitida correctamente.");
        return response;
    }
}
