package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.MockPaymentRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PaymentInitRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PaymentInitResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.PaymentResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.*;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.PaymentRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public PaymentService(PaymentRepository paymentRepository,
                          SubscriptionPlanRepository planRepository,
                          SubscriptionRepository subscriptionRepository,
                          CompanyRepository companyRepository,
                          AuditLogService auditLogService) {
        this.paymentRepository = paymentRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.companyRepository = companyRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PaymentInitResponse initPayment(User user, PaymentInitRequest request) {
        if (user.getCompany() == null) {
            throw new BusinessException("El usuario no tiene una empresa asociada.");
        }
        Company company = user.getCompany();

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new BusinessException("Plan no encontrado."));

        if (!plan.getActive()) {
            throw new BusinessException("El plan no está activo.");
        }

        Subscription sub = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId())
                .orElseGet(() -> {
                    Subscription newSub = Subscription.builder()
                            .company(company)
                            .plan(plan)
                            .status(SubscriptionStatus.PENDIENTE_PAGO)
                            .build();
                    return subscriptionRepository.save(newSub);
                });

        Payment payment = Payment.builder()
                .subscription(sub)
                .company(company)
                .amount(plan.getMonthlyAmount())
                .currency(plan.getCurrency())
                .status(PaymentStatus.PENDIENTE)
                .provider(PaymentProvider.MOCK) // Can be modified by configuration
                .mode(PaymentMode.MOCK)
                .build();

        payment = paymentRepository.save(payment);
        
        auditLogService.log(user, user.getEmail(), "PAYMENT_CREATED", "Pago inicializado para plan " + plan.getName(), "");

        return PaymentInitResponse.builder()
                .paymentId(payment.getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .build();
    }

    @Transactional
    public PaymentResponse confirmMockPayment(User user, MockPaymentRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new BusinessException("Pago no encontrado."));

        if (payment.getStatus() != PaymentStatus.PENDIENTE) {
            throw new BusinessException("El pago ya fue procesado.");
        }

        if (request.isSimulateApproval()) {
            payment.setStatus(PaymentStatus.APROBADO);
            payment.setConfirmedAt(LocalDateTime.now());
            
            Subscription sub = payment.getSubscription();
            int trialDays = sub.getPlan().getTrialDays() != null ? sub.getPlan().getTrialDays() : 0;
            
            if (trialDays > 0) {
                sub.setStatus(SubscriptionStatus.PRUEBA_ACTIVA);
                sub.setStartDate(LocalDate.now());
                sub.setTrialEndsAt(LocalDate.now().plusDays(trialDays));
                sub.setCurrentPeriodStart(LocalDate.now());
                sub.setCurrentPeriodEnd(LocalDate.now().plusDays(trialDays));
                sub.setNextBillingDate(LocalDate.now().plusDays(trialDays));
            } else {
                sub.setStatus(SubscriptionStatus.ACTIVA);
                sub.setStartDate(LocalDate.now());
                sub.setCurrentPeriodStart(LocalDate.now());
                sub.setCurrentPeriodEnd(LocalDate.now().plusMonths(1));
                sub.setNextBillingDate(LocalDate.now().plusMonths(1));
            }
            subscriptionRepository.save(sub);

            Company company = payment.getCompany();
            if (trialDays > 0) {
                company.setSubscriptionStatus(SubscriptionStatus.PRUEBA_ACTIVA);
                auditLogService.log(user, user.getEmail(), "PAYMENT_APPROVED", "Validación mock aprobada (Prueba Gratis)", "");
                auditLogService.log(user, user.getEmail(), "SUBSCRIPTION_TRIAL_ACTIVATED", "Prueba gratis activada", "");
            } else {
                company.setSubscriptionStatus(SubscriptionStatus.ACTIVA);
                auditLogService.log(user, user.getEmail(), "PAYMENT_APPROVED", "Pago mock aprobado", "");
                auditLogService.log(user, user.getEmail(), "SUBSCRIPTION_ACTIVATED", "Suscripción activada", "");
            }
            companyRepository.save(company);
        } else {
            payment.setStatus(PaymentStatus.RECHAZADO);
            auditLogService.log(user, user.getEmail(), "PAYMENT_REJECTED", "Pago mock rechazado", "");
        }

        paymentRepository.save(payment);

        return PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .confirmedAt(payment.getConfirmedAt())
                .build();
    }
}
