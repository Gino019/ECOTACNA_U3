package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findTopByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Optional<Subscription> findByProviderSubscriptionId(String providerSubscriptionId);

    long countByStatus(com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Subscription s JOIN FETCH s.company WHERE s.status IN :statuses AND s.currentPeriodEnd >= :startDate AND s.currentPeriodEnd <= :endDate ORDER BY s.currentPeriodEnd ASC")
    java.util.List<Subscription> findUpcomingCharges(@org.springframework.data.repository.query.Param("statuses") java.util.List<com.GAKOM_ECOTACNA.ECOTACNA.model.SubscriptionStatus> statuses, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate);
}
