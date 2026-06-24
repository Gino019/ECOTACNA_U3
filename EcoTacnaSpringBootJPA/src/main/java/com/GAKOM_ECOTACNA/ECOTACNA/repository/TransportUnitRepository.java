package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.TransportUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransportUnitRepository extends JpaRepository<TransportUnit, Long> {

    List<TransportUnit> findByCollectorCompanyIdOrderByCreatedAtDesc(Long collectorCompanyId);

    long countByCollectorCompanyId(Long collectorCompanyId);

    boolean existsByPlateIgnoreCase(String plate);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM TransportUnit t " +
           "WHERE UPPER(t.plate) = UPPER(:plate) AND (:excludeId IS NULL OR t.id <> :excludeId)")
    boolean existsByPlateExcludingId(@Param("plate") String plate, @Param("excludeId") Long excludeId);

    @Query("SELECT t FROM TransportUnit t JOIN FETCH t.collectorCompany WHERE t.id = :id")
    Optional<TransportUnit> findByIdWithCompany(@Param("id") Long id);

    @Query("SELECT t FROM TransportUnit t JOIN FETCH t.collectorCompany ORDER BY t.createdAt DESC")
    List<TransportUnit> findAllWithCompany();
}
