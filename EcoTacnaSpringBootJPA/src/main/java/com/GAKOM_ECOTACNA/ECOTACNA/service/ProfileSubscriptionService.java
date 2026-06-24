package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.MessageResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.dto.ProfileSubscriptionStatusResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Subscription;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class ProfileSubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final CompanyRepository companyRepository;

    public ProfileSubscriptionService(SubscriptionRepository subscriptionRepository, CompanyRepository companyRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public ProfileSubscriptionStatusResponse getSubscriptionStatus(User user) {
        if (user.getCompany() == null) {
            throw new BusinessException("El usuario no tiene una empresa asociada.");
        }
        Company company = user.getCompany();
        Optional<Subscription> optSub = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId());

        ProfileSubscriptionStatusResponse.ProfileSubscriptionStatusResponseBuilder builder = ProfileSubscriptionStatusResponse.builder()
                .tipoEmpresa(company.getCompanyType())
                .estadoSuscripcion(company.getSubscriptionStatus());

        if (optSub.isPresent()) {
            Subscription sub = optSub.get();
            builder.planNombre(sub.getPlan().getName())
                   .precioMensual(sub.getPlan().getMonthlyAmount())
                   .fechaInicio(sub.getStartDate())
                   .fechaFinPrueba(sub.getTrialEndsAt())
                   .fechaVencimiento(sub.getCurrentPeriodEnd())
                   .cancelacionProgramada(Boolean.TRUE.equals(sub.getScheduledCancellation()));
            
            LocalDate today = LocalDate.now();
            boolean pruebaActiva = false;
            long diasRestantes = 0;

            if (company.getSubscriptionStatus() == SubscriptionStatus.PRUEBA_ACTIVA && sub.getTrialEndsAt() != null) {
                pruebaActiva = true;
                diasRestantes = ChronoUnit.DAYS.between(today, sub.getTrialEndsAt());
            } else if (sub.getCurrentPeriodEnd() != null) {
                diasRestantes = ChronoUnit.DAYS.between(today, sub.getCurrentPeriodEnd());
            }

            if (diasRestantes < 0) {
                diasRestantes = 0;
            }

            builder.pruebaActiva(pruebaActiva);
            builder.diasRestantes(diasRestantes);

            // Logica de botones
            boolean puedeCancelar = false;
            boolean puedeRenovar = false;
            String mensaje = "";

            if (company.getSubscriptionStatus() == SubscriptionStatus.PRUEBA_ACTIVA) {
                puedeCancelar = true;
                mensaje = "Tu prueba gratuita vence el " + format(sub.getTrialEndsAt()) + ". Luego se aplicará el plan de S/ " + sub.getPlan().getMonthlyAmount() + " mensual.";
            } else if (company.getSubscriptionStatus() == SubscriptionStatus.ACTIVA) {
                if (Boolean.TRUE.equals(sub.getScheduledCancellation())) {
                    puedeCancelar = false;
                    mensaje = "Tu cancelación fue programada. Mantendrás acceso hasta el " + format(sub.getCurrentPeriodEnd()) + ".";
                } else {
                    puedeCancelar = true;
                    mensaje = "Tu suscripción está activa hasta el " + format(sub.getCurrentPeriodEnd()) + ".";
                }
            } else if (company.getSubscriptionStatus() == SubscriptionStatus.VENCIDA || company.getSubscriptionStatus() == SubscriptionStatus.PENDIENTE_PAGO) {
                puedeRenovar = true;
                mensaje = "Tu suscripción venció. Renueva para continuar usando EcoTacna.";
            } else if (company.getSubscriptionStatus() == SubscriptionStatus.CANCELADA) {
                puedeRenovar = true;
                mensaje = "Tu suscripción fue cancelada. Renueva para volver a usar EcoTacna.";
            }

            builder.puedeCancelar(puedeCancelar);
            builder.puedeRenovar(puedeRenovar);
            builder.mensajeEstado(mensaje);
        } else {
            // Default en caso de no tener sub (por ejemplo, recién creada sin plan)
            BigDecimal precio = company.getCompanyType() == CompanyType.RECOLECTORA ? new BigDecimal("299.90") : new BigDecimal("29.90");
            builder.planNombre("Plan " + (company.getCompanyType() == CompanyType.RECOLECTORA ? "Recolectora" : "Generadora"))
                   .precioMensual(precio)
                   .pruebaActiva(false)
                   .cancelacionProgramada(false)
                   .puedeCancelar(false)
                   .puedeRenovar(true)
                   .diasRestantes(0L)
                   .mensajeEstado("No cuentas con una suscripción activa. Por favor contrata un plan.");
        }

        return builder.build();
    }

    @Transactional
    public MessageResponse cancelSubscription(User user) {
        if (user.getCompany() == null) {
            throw new BusinessException("El usuario no tiene una empresa asociada.");
        }
        Company company = user.getCompany();
        Optional<Subscription> optSub = subscriptionRepository.findTopByCompanyIdOrderByCreatedAtDesc(company.getId());

        if (optSub.isEmpty()) {
            throw new BusinessException("No se encontró una suscripción para cancelar.");
        }

        Subscription sub = optSub.get();

        if (company.getSubscriptionStatus() == SubscriptionStatus.PRUEBA_ACTIVA) {
            // Si está en prueba, cancelar asegura 0 cobro pero mantiene acceso hasta el final de la prueba.
            sub.setScheduledCancellation(true);
            subscriptionRepository.save(sub);
            return new MessageResponse("Suscripción cancelada exitosamente durante periodo de prueba. Mantendrás acceso hasta que finalice el periodo gratuito.");
        } else if (company.getSubscriptionStatus() == SubscriptionStatus.ACTIVA) {
            if (Boolean.TRUE.equals(sub.getScheduledCancellation())) {
                throw new BusinessException("La suscripción ya se encuentra con cancelación programada.");
            }
            sub.setScheduledCancellation(true);
            subscriptionRepository.save(sub);
            return new MessageResponse("Cancelación programada exitosamente. Mantendrás acceso hasta tu próxima fecha de facturación.");
        } else {
            throw new BusinessException("No se puede cancelar una suscripción en estado: " + company.getSubscriptionStatus());
        }
    }

    @Transactional
    public MessageResponse renewSubscription(User user) {
        // En un caso real, aquí se prepararía un intent de pago, o se redirigiría a la pasarela.
        return new MessageResponse("Redirigiendo a pasarela de pago para renovar la suscripción...");
    }

    private String format(LocalDate date) {
        if (date == null) return "XX/XX/XXXX";
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}
