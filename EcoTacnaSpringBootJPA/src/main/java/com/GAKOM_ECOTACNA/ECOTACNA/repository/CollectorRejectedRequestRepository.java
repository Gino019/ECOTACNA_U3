package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.CollectorRejectedRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectorRejectedRequestRepository extends JpaRepository<CollectorRejectedRequest, Long> {
    
    boolean existsByPickupRequestIdAndCollectorCompanyId(Long pickupRequestId, Long collectorCompanyId);

    List<CollectorRejectedRequest> findByCollectorCompanyId(Long collectorCompanyId);
}
