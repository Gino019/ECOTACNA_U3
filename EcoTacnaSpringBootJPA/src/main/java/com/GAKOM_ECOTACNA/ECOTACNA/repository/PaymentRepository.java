package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status AND p.createdAt >= :start")
    java.math.BigDecimal sumPaymentsByStatusSince(@org.springframework.data.repository.query.Param("status") com.GAKOM_ECOTACNA.ECOTACNA.model.PaymentStatus status, @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status AND p.createdAt >= :start AND p.createdAt < :end")
    java.math.BigDecimal sumPaymentsByStatusBetween(@org.springframework.data.repository.query.Param("status") com.GAKOM_ECOTACNA.ECOTACNA.model.PaymentStatus status, @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}
