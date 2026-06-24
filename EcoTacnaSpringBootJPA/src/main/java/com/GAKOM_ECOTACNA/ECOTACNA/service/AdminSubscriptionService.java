package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.ResourceNotFoundException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import com.GAKOM_ECOTACNA.ECOTACNA.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSubscriptionService {

    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;

    @Autowired
    public AdminSubscriptionService(CompanyRepository companyRepository, AuditLogService auditLogService) {
        this.companyRepository = companyRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Company updateSubscription(Long companyId, SubscriptionStatus status, User admin, String ipAddress) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa no encontrada."));

        SubscriptionStatus oldStatus = company.getSubscriptionStatus();
        if (oldStatus == status) {
            throw new BusinessException("La empresa ya tiene el estado de suscripción " + status);
        }

        company.setSubscriptionStatus(status);
        company = companyRepository.save(company);

        auditLogService.log(admin, admin.getEmail(), "CAMBIO_SUSCRIPCION",
                "Suscripción de empresa " + company.getBusinessName() + " cambiada de " + oldStatus + " a " + status, ipAddress);

        return company;
    }
}
