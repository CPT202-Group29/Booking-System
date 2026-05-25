package com.cpt202.booking_system.repository;

import com.cpt202.booking_system.entity.Specialist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpecialistRepository extends JpaRepository<Specialist, Integer> {

    List<Specialist> findByStatus(Integer status);

    List<Specialist> findByExpertiseContaining(String expertise);

    List<Specialist> findByLevel(String level);

    List<Specialist> findByApprovalStatus(String approvalStatus);

    Optional<Specialist> findByUserId(Integer userId);
}
