package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequestIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupRequestIncidentRepository extends JpaRepository<PickupRequestIncident, Long> {
    List<PickupRequestIncident> findByPickupRequestIdOrderByCreatedAtDesc(Long pickupRequestId);
    boolean existsByPickupRequestId(Long pickupRequestId);
}
