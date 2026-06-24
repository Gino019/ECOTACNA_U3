package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionValidator {

    public boolean hasActiveSubscriptionStatus(Company company) {
        if (company == null || company.getSubscriptionStatus() == null) {
            return false;
        }
        return company.getSubscriptionStatus() == SubscriptionStatus.ACTIVA
                || company.getSubscriptionStatus() == SubscriptionStatus.PRUEBA_ACTIVA;
    }

    public boolean canCollectorManageTransportUnits(Company company) {
        return company != null
                && company.getCompanyType() == CompanyType.RECOLECTORA
                && hasActiveSubscriptionStatus(company);
    }

    public void ensureCollectorCanManageTransportUnits(Company company) {
        if (company == null) {
            throw new BusinessException("No se encontro informacion de la empresa recolectora.");
        }
        if (company.getCompanyType() != CompanyType.RECOLECTORA) {
            throw new BusinessException("La empresa debe ser de tipo RECOLECTORA.");
        }
        if (!hasActiveSubscriptionStatus(company)) {
            throw new BusinessException("Tu empresa recolectora aun no tiene una suscripcion activa. Completa el proceso de pago para registrar unidades.");
        }
    }

    public void validateActiveSubscription(Company company) {
        if (company == null) {
            throw new BusinessException("No se encontro informacion de la empresa.");
        }

        if (company.getCompanyType() == CompanyType.GENERADORA) {
            if (!hasActiveSubscriptionStatus(company)) {
                throw new BusinessException("Tu suscripcion no permite registrar solicitudes. Activa o renueva tu plan.");
            }
        } else if (company.getCompanyType() == CompanyType.RECOLECTORA) {
            if (!hasActiveSubscriptionStatus(company)) {
                throw new BusinessException("Tu empresa recolectora aun no tiene una suscripcion activa. Completa el proceso de pago para continuar.");
            }
        } else if (!hasActiveSubscriptionStatus(company)) {
            throw new BusinessException("La empresa no tiene una suscripcion activa para realizar esta operacion.");
        }
    }
}
