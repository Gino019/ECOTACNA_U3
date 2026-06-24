package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.CompanyBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyBranchRepository extends JpaRepository<CompanyBranch, Long> {
    List<CompanyBranch> findByCompanyId(Long companyId);
}
