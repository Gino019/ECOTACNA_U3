package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedPaymentConfirmRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedPaymentResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedTokenRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.SimulatedTokenResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Payment;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PaymentMode;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PaymentProvider;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PaymentStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Subscription;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionPlan;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PaymentRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulatedPaymentService {

    private static final Map<String, String> WHITELIST_CARDS = Map.of(
            "4111111111111111", "APPROVED",
            "4111222233334444", "APPROVED",
            "4000000000000002", "REJECTED",
            "4000000000009995", "FUNDS_INSUFFICIENT",
            "4000000000000069", "EXPIRED",
            "4000000000000127", "CVV_INVALID"
    );

    private static final Map<String, String> SCENARIO_ERROR_MESSAGES = Map.of(
            "REJECTED", "Pago simulado rechazado.",
            "FUNDS_INSUFFICIENT", "Fondos insuficientes.",
            "EXPIRED", "Tarjeta vencida.",
            "CVV_INVALID", "CVV invalido."
    );

    private final CompanyRepository companyRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final Map<String, SimulatedTokenRecord> tokenStore = new ConcurrentHashMap<>();

    public SimulatedPaymentService(CompanyRepository companyRepository,
                                   SubscriptionPlanRepository planRepository,
                                   SubscriptionRepository subscriptionRepository,
                                   PaymentRepository paymentRepository) {
        this.companyRepository = companyRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
    }

    public SimulatedTokenResponse createToken(SimulatedTokenRequest request) {
        String normalizedCard = normalizeCardNumber(request.getCardNumber());
        validateCardInput(normalizedCard, request.getCvv(), request.getExpiry());

        String scenario = WHITELIST_CARDS.get(normalizedCard);
        if (scenario == null) {
            throw new BusinessException("Tarjeta no autorizada para la simulacion.");
        }

        String last4 = normalizedCard.substring(normalizedCard.length() - 4);
        String tokenId = "tkn_sim_" + shortId();
        LocalDateTime created = LocalDateTime.now();

        tokenStore.put(tokenId, new SimulatedTokenRecord(tokenId, last4, detectBrand(normalizedCard), request.getEmail(), scenario, created));

        return SimulatedTokenResponse.builder()
                .id(tokenId)
                .object("token")
                .cardLast4(last4)
                .brand(detectBrand(normalizedCard))
                .scenario(scenario)
                .email(request.getEmail())
                .created(created)
                .build();
    }

    @Transactional
    public SimulatedPaymentResponse confirmPayment(Long companyId, SimulatedPaymentConfirmRequest request) {
        if (!"CARD".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new BusinessException("Metodo de pago simulado no soportado.");
        }

        SimulatedTokenRecord token = tokenStore.get(request.getSimulatedToken());
        if (token == null) {
            throw new BusinessException("Token simulado invalido o expirado.");
        }
        if (!token.email().equalsIgnoreCase(request.getEmail())) {
            throw new BusinessException("El correo no coincide con el token simulado.");
        }

        if (!"APPROVED".equals(token.scenario())) {
            String errorMsg = SCENARIO_ERROR_MESSAGES.getOrDefault(token.scenario(), "Pago simulado rechazado.");
            throw new BusinessException(errorMsg);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("No se encontro la empresa."));
        validateCompanyReadyForPayment(company);

        SubscriptionPlan plan = planRepository.findByCompanyTypeAndActiveTrue(company.getCompanyType())
                .orElseThrow(() -> new BusinessException("No se encontro plan activo para este tipo de empresa."));

        int trialDays = plan.getTrialDays() != null ? plan.getTrialDays() : 0;
        BigDecimal todayAmount = plan.getCompanyType() == CompanyType.GENERADORA
                ? BigDecimal.ZERO
                : plan.getMonthlyAmount();
        SubscriptionStatus nextStatus = trialDays > 0 ? SubscriptionStatus.PRUEBA_ACTIVA : SubscriptionStatus.ACTIVA;
        String chargeId = "chr_sim_" + shortId();

        Subscription subscription = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId())
                .orElseGet(Subscription::new);
        applySubscription(subscription, company, plan, nextStatus, trialDays, token);
        subscription = subscriptionRepository.save(subscription);

        Payment payment = Payment.builder()
                .subscription(subscription)
                .company(company)
                .amount(todayAmount)
                .currency(plan.getCurrency())
                .status(PaymentStatus.APROBADO)
                .provider(PaymentProvider.MOCK)
                .mode(PaymentMode.MOCK)
                .providerTokenId(token.id())
                .providerChargeId(chargeId)
                .description("API de Pagos Simulada EcoTacna - tarjeta terminada en " + token.cardLast4())
                .rawProviderResponse("{\"provider\":\"SIMULATED\",\"cardLast4\":\"" + token.cardLast4() + "\"}")
                .confirmedAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        company.setSubscriptionStatus(nextStatus);
        companyRepository.save(company);
        tokenStore.remove(token.id());

        String message = trialDays > 0
                ? "Prueba gratuita activada correctamente."
                : "Pago simulado aprobado y acceso activado.";

        return SimulatedPaymentResponse.builder()
                .success(true)
                .companyId(company.getId())
                .companyName(company.getBusinessName())
                .companyType(company.getCompanyType().name())
                .planName(displayPlanName(company.getCompanyType()))
                .subscriptionStatus(nextStatus.name())
                .todayAmount(todayAmount)
                .monthlyAmount(plan.getMonthlyAmount())
                .trialDays(trialDays)
                .providerTokenId(token.id())
                .providerChargeId(chargeId)
                .message(message)
                .build();
    }

    private void applySubscription(Subscription subscription,
                                   Company company,
                                   SubscriptionPlan plan,
                                   SubscriptionStatus status,
                                   int trialDays,
                                   SimulatedTokenRecord token) {
        LocalDate today = LocalDate.now();
        LocalDate periodEnd = trialDays > 0 ? today.plusDays(trialDays) : today.plusMonths(1);

        subscription.setCompany(company);
        subscription.setPlan(plan);
        subscription.setStatus(status);
        subscription.setStartDate(today);
        subscription.setTrialEndsAt(trialDays > 0 ? periodEnd : null);
        subscription.setCurrentPeriodStart(today);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setNextBillingDate(periodEnd);
        subscription.setProvider("SIMULATED");
        subscription.setProviderCardId("card_sim_" + token.cardLast4());
        subscription.setProviderCustomerId("cus_sim_" + company.getId());
        subscription.setProviderSubscriptionId("sub_sim_" + company.getId() + "_" + shortId());
    }

    private void validateCompanyReadyForPayment(Company company) {
        SubscriptionStatus status = company.getSubscriptionStatus();
        if (status == SubscriptionStatus.ACTIVA || status == SubscriptionStatus.PRUEBA_ACTIVA) {
            throw new BusinessException("La empresa ya tiene una suscripcion activa.");
        }
        if (status == SubscriptionStatus.SUSPENDIDA || status == SubscriptionStatus.CANCELADA) {
            throw new BusinessException("La empresa no esta apta para pago simulado.");
        }
    }

    private void validateCardInput(String cardNumber, String cvv, String expiry) {
        if (!cardNumber.matches("\\d{13,19}")) {
            throw new BusinessException("El numero de tarjeta debe contener solo digitos validos.");
        }
        if (cvv == null || !cvv.matches("\\d{3,4}")) {
            throw new BusinessException("El CVV debe tener 3 o 4 digitos.");
        }
        if (expiry == null || !expiry.matches("\\d{2}/\\d{2}")) {
            throw new BusinessException("La fecha de vencimiento debe tener formato MM/AA.");
        }

        YearMonth expiryMonth;
        try {
            expiryMonth = YearMonth.parse(expiry, DateTimeFormatter.ofPattern("MM/yy"));
        } catch (DateTimeParseException ex) {
            throw new BusinessException("La fecha de vencimiento debe tener un mes valido.");
        }

        int month = Integer.parseInt(expiry.substring(0, 2));
        if (month < 1 || month > 12) {
            throw new BusinessException("El mes de vencimiento debe estar entre 01 y 12.");
        }
        if (expiryMonth.isBefore(YearMonth.now())) {
            throw new BusinessException("La tarjeta simulada esta vencida.");
        }
    }

    private String normalizeCardNumber(String cardNumber) {
        return cardNumber == null ? "" : cardNumber.replaceAll("\\s+", "");
    }

    private String detectBrand(String cardNumber) {
        return cardNumber.startsWith("4") ? "Visa" : "Simulated";
    }

    private String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String displayPlanName(CompanyType companyType) {
        return companyType == CompanyType.GENERADORA ? "Plan Generador" : "Plan Recolector";
    }

    private record SimulatedTokenRecord(String id, String cardLast4, String brand, String email, String scenario, LocalDateTime created) {
    }
}
