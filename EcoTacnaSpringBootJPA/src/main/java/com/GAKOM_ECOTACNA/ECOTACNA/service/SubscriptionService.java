package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.SubscriptionStatusResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PaymentRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final CompanyRepository companyRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogService auditLogService;
    private final SubscriptionValidator validator;

    @Autowired
    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               SubscriptionPlanRepository planRepository,
                               CompanyRepository companyRepository,
                               PaymentRepository paymentRepository,
                               AuditLogService auditLogService,
                               SubscriptionValidator validator) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.companyRepository = companyRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogService = auditLogService;
        this.validator = validator;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Consulta de estado
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getMySubscriptionStatus(User user) {
        if (user.getCompany() == null) {
            throw new BusinessException("El usuario no tiene una empresa asociada.");
        }
        Company company = user.getCompany();

        Optional<Subscription> optSub = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId());

        SubscriptionStatusResponse.SubscriptionStatusResponseBuilder builder = SubscriptionStatusResponse.builder()
                .companyName(company.getBusinessName())
                .companyType(company.getCompanyType())
                .status(company.getSubscriptionStatus());

        boolean canOperate = false;
        if (company.getCompanyType() == CompanyType.GENERADORA) {
            canOperate = validator.hasActiveSubscriptionStatus(company);
        } else if (company.getCompanyType() == CompanyType.RECOLECTORA) {
            canOperate = validator.hasActiveSubscriptionStatus(company);
        }
        builder.canOperate(canOperate);

        if (optSub.isPresent()) {
            Subscription sub = optSub.get();
            builder.planName(sub.getPlan().getName())
                   .monthlyAmount(sub.getPlan().getMonthlyAmount())
                   .currency(sub.getPlan().getCurrency())
                   .trialEndsAt(sub.getTrialEndsAt())
                   .currentPeriodEnd(sub.getCurrentPeriodEnd());
        }

        return builder.build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Activación de suscripción tras pago exitoso
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Activa (o crea) la suscripcion de una empresa tras confirmar internamente el pago.
     *
     * Lógica:
     * - Si el plan tiene trialDays > 0 y el monto cobrado es 0, el estado es PRUEBA_ACTIVA.
     * - En cualquier otro caso (cargo real o prueba sin días), el estado es ACTIVA.
     * - Se registra el pago en la tabla payments y se actualiza la columna de estado
     *   en la tabla companies.
     *
     * @param company       Empresa que contrata la suscripción.
     * @param plan          Plan de suscripción elegido.
     * @param amountCharged Monto efectivamente cobrado (puede ser 0 en prueba).
     * @param ipAddress     IP del solicitante (auditoría).
     * @return La suscripción activada.
     */
    @Transactional
    public Subscription activateSubscription(Company company,
                                             SubscriptionPlan plan,
                                             BigDecimal amountCharged,
                                             String ipAddress) {

        boolean isTrial = plan.getTrialDays() != null
                && plan.getTrialDays() > 0
                && (amountCharged == null || amountCharged.compareTo(BigDecimal.ZERO) == 0);

        SubscriptionStatus newStatus = isTrial ? SubscriptionStatus.PRUEBA_ACTIVA : SubscriptionStatus.ACTIVA;

        LocalDate today = LocalDate.now();
        LocalDate trialEnd = isTrial ? today.plusDays(plan.getTrialDays()) : null;
        LocalDate periodEnd = isTrial ? trialEnd : today.plusMonths(1);

        // Buscar suscripción existente de la empresa o crear una nueva
        Subscription subscription = subscriptionRepository
                .findTopByCompanyIdOrderByCreatedAtDesc(company.getId())
                .orElse(Subscription.builder().company(company).build());

        subscription.setPlan(plan);
        subscription.setStatus(newStatus);
        subscription.setStartDate(today);
        subscription.setTrialEndsAt(trialEnd);
        subscription.setCurrentPeriodStart(today);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setNextBillingDate(periodEnd);
        subscription.setProvider("MOCK");

        subscription = subscriptionRepository.save(subscription);

        // Actualizar estado de suscripción en la tabla companies
        company.setSubscriptionStatus(newStatus);
        companyRepository.save(company);

        // Registrar el pago (incluso si fue S/ 0.00 en prueba, para trazabilidad)
        BigDecimal charged = amountCharged != null ? amountCharged : BigDecimal.ZERO;
        Payment payment = Payment.builder()
                .subscription(subscription)
                .company(company)
                .amount(charged)
                .currency("PEN")
                .status(PaymentStatus.APROBADO)
                .provider(PaymentProvider.MOCK)
                .mode(PaymentMode.MOCK)
                .description("Activación plan " + plan.getName() + (isTrial ? " (prueba gratuita)" : ""))
                .build();
        paymentRepository.save(payment);

        // Auditoría
        auditLogService.log(
                null,
                company.getBusinessName(),
                "SUBSCRIPTION_ACTIVATED",
                String.format("Plan=%s | Estado=%s | Monto=S/ %.2f | IP=%s",
                        plan.getCode(), newStatus, charged, ipAddress),
                ipAddress
        );

        log.info("Suscripción activada (Mock): empresa={}, plan={}, estado={}",
                company.getRuc(), plan.getCode(), newStatus);

        return subscription;
    }
}
