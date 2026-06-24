package com.GAKOM_ECOTACNA.ECOTACNA.config;

import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionPlan;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.SubscriptionPlanRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.UserRepository;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedSubscriptionPlans(
            SubscriptionPlanRepository planRepository, 
            UserRepository userRepository,
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (planRepository.count() == 0) {
                SubscriptionPlan generadorPlan = SubscriptionPlan.builder()
                        .code("PLAN_GEN_01")
                        .name("Plan Generador Básico")
                        .companyType(CompanyType.GENERADORA)
                        .monthlyAmount(new BigDecimal("29.90"))
                        .currency("PEN")
                        .trialDays(7)
                        .active(true)
                        .build();

                SubscriptionPlan recolectorPlan = SubscriptionPlan.builder()
                        .code("PLAN_REC_01")
                        .name("Plan Recolector Pro")
                        .companyType(CompanyType.RECOLECTORA)
                        .monthlyAmount(new BigDecimal("299.90"))
                        .currency("PEN")
                        .trialDays(0)
                        .active(true)
                        .build();

                planRepository.save(generadorPlan);
                planRepository.save(recolectorPlan);
                System.out.println("====== DB SEEDED: Subscription Plans created ======");
            } else {
                // Actualizar planes si tienen precios antiguos
                planRepository.findAll().forEach(plan -> {
                    if (plan.getCompanyType() == CompanyType.GENERADORA && plan.getMonthlyAmount().compareTo(new BigDecimal("29.90")) != 0) {
                        plan.setMonthlyAmount(new BigDecimal("29.90"));
                        plan.setTrialDays(7);
                        planRepository.save(plan);
                        System.out.println("====== DB SEEDED: Generadora Plan Updated to 29.90 ======");
                    }
                    if (plan.getCompanyType() == CompanyType.RECOLECTORA && plan.getMonthlyAmount().compareTo(new BigDecimal("299.90")) != 0) {
                        plan.setMonthlyAmount(new BigDecimal("299.90"));
                        planRepository.save(plan);
                        System.out.println("====== DB SEEDED: Recolectora Plan Updated to 299.90 ======");
                    }
                });
            }

            // Reset demo passwords to Password123 for local testing
            System.out.println("====== DB USER COUNT: " + userRepository.count() + " ======");
            userRepository.findAll().forEach(u -> {
                System.out.println("====== DB USER: " + u.getEmail() + " | role: " + u.getRole() + " | enabled: " + u.isEnabled() + " ======");
            });
            
            String[] targetEmails = {
                "laculinaria@gmail.com",
                "recolector@test.com",
                "admin@ecotacna.com"
            };

            for (String email : targetEmails) {
                userRepository.findByEmail(email).ifPresent(user -> {
                    user.setPassword(passwordEncoder.encode("Password123"));
                    user.setEnabled(true);
                    userRepository.save(user);
                    
                    Company company = user.getCompany();
                    if (company != null) {
                        company.setSubscriptionStatus(SubscriptionStatus.ACTIVA);
                        companyRepository.save(company);
                    }
                    System.out.println("====== DB SEEDED: Password reset to Password123 for target user: " + email + " ======");
                });
            }
        };
    }
}
