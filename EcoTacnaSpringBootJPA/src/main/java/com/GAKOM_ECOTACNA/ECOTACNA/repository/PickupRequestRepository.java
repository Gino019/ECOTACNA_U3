package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {

    List<PickupRequest> findByCompanyIdOrderByRequestedAtDesc(Long companyId);

    @Query("SELECT pr FROM PickupRequest pr WHERE pr.collectorUserId IN (SELECT u.id FROM User u WHERE u.company.id = :companyId) ORDER BY pr.requestedAt DESC")
    List<PickupRequest> findByCollectorCompanyIdOrderByRequestedAtDesc(@Param("companyId") Long companyId);

    long countByCompanyIdAndStatusIn(Long companyId, List<PickupRequestStatus> statuses);

    long countByStatus(PickupRequestStatus status);

    @Query("SELECT pr FROM PickupRequest pr JOIN FETCH pr.company ORDER BY pr.requestedAt DESC")
    List<PickupRequest> findAllWithCompany();

    @Query("""
            SELECT pr FROM PickupRequest pr
            WHERE pr.collectorUserId = :collectorUserId
            ORDER BY COALESCE(pr.scheduledAt, pr.requestedAt) DESC
            """)
    List<PickupRequest> findByCollectorUserId(@Param("collectorUserId") Long collectorUserId);

    @Query("""
            SELECT pr FROM PickupRequest pr JOIN FETCH pr.company 
            WHERE pr.status = :status 
            AND pr.collectorUserId IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM CollectorRejectedRequest crr 
                WHERE crr.pickupRequest = pr 
                AND crr.collectorCompany.id = :collectorCompanyId
            )
            ORDER BY pr.requestedAt DESC
            """)
    List<PickupRequest> findAvailableRequests(@Param("collectorCompanyId") Long collectorCompanyId, @Param("status") PickupRequestStatus status);

    @Query("""
            SELECT pr FROM PickupRequest pr JOIN FETCH pr.company
            WHERE pr.collectorUserId = :collectorUserId
            AND pr.status IN (:statuses)
            ORDER BY pr.scheduledAt ASC, pr.requestedAt ASC
            LIMIT 1
            """)
    PickupRequest findFirstActiveRequest(@Param("collectorUserId") Long collectorUserId, @Param("statuses") List<PickupRequestStatus> statuses);

    @Query("""
            SELECT COUNT(pr) > 0 FROM PickupRequest pr 
            WHERE pr.collectorUserId IN (SELECT u.id FROM User u WHERE u.company.id = :companyId)
            AND pr.status IN (:statuses)
            """)
    boolean existsActiveRequestByCollectorCompanyId(@Param("companyId") Long companyId, @Param("statuses") List<PickupRequestStatus> statuses);

    @Query("""
            SELECT pr FROM PickupRequest pr JOIN FETCH pr.company
            WHERE pr.company.id = :companyId
            AND pr.status IN (:statuses)
            ORDER BY pr.scheduledAt ASC, pr.requestedAt ASC
            LIMIT 1
            """)
    PickupRequest findFirstActiveRequestByCompanyId(@Param("companyId") Long companyId, @Param("statuses") List<PickupRequestStatus> statuses);

    @Query("""
            SELECT pr FROM PickupRequest pr JOIN FETCH pr.company 
            WHERE pr.company.id = :companyId 
            AND pr.requestedAt >= :desde AND pr.requestedAt <= :hasta 
            ORDER BY pr.requestedAt DESC
            """)
    List<PickupRequest> findByCompanyIdAndRequestedAtBetweenOrderByRequestedAtDesc(@Param("companyId") Long companyId, @Param("desde") java.time.LocalDateTime desde, @Param("hasta") java.time.LocalDateTime hasta);

    @Query("""
            SELECT pr FROM PickupRequest pr JOIN FETCH pr.company 
            WHERE pr.collectorUserId = :collectorUserId 
            AND pr.requestedAt >= :desde AND pr.requestedAt <= :hasta 
            ORDER BY pr.requestedAt DESC
            """)
    List<PickupRequest> findByCollectorUserIdAndRequestedAtBetweenOrderByRequestedAtDesc(@Param("collectorUserId") Long collectorUserId, @Param("desde") java.time.LocalDateTime desde, @Param("hasta") java.time.LocalDateTime hasta);

    @Query("SELECT SUM(pr.litrosConfirmados) FROM PickupRequest pr WHERE pr.status = :status")
    java.math.BigDecimal sumLitrosConfirmados(@Param("status") PickupRequestStatus status);

    @Query("SELECT SUM(pr.montoTotal) FROM PickupRequest pr WHERE pr.estadoPago = 'PAGADO'")
    java.math.BigDecimal sumMontoTotalPagado();
}
