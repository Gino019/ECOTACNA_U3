package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByRuc(String ruc);
    List<Company> findByCompanyTypeOrderByCreatedAtDesc(CompanyType companyType);
    long countBySubscriptionStatus(com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus subscriptionStatus);
    long countByCompanyTypeAndSubscriptionStatusIn(CompanyType companyType, List<com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus> statuses);
}
