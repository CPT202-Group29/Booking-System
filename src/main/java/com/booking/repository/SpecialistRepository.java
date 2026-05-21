package com.booking.repository;

import com.booking.entity.Specialist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpecialistRepository extends JpaRepository<Specialist, Integer> {

    // find specialists by available/unavailable status
    public List<Specialist> findByStatus(Integer status);

    // search specialists by expertise keyword
    public List<Specialist> findByExpertiseContaining(String expertise);

    // find specialists by level (Junior, Intermediate, Senior)
    public List<Specialist> findByLevel(String level);

    // find specialists by approval status (PENDING, APPROVED, REJECTED)
    public List<Specialist> findByApprovalStatus(String approvalStatus);

    // find the specialist record linked to a user account
    public Optional<Specialist> findByUserId(Integer userId);
}
