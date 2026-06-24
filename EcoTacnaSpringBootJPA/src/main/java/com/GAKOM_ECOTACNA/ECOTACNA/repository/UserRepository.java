package com.GAKOM_ECOTACNA.ECOTACNA.repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Role;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company"})
    Optional<User> findByEmail(String email);

    List<User> findByCompanyId(Long companyId);

    List<User> findByCompanyIdAndRole(Long companyId, Role role);

    boolean existsByEmailAndIdNot(String email, Long id);
}
