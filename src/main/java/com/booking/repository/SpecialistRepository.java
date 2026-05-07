package com.booking.repository;

import com.booking.entity.Specialist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialistRepository extends JpaRepository<Specialist, Integer> {
    List<Specialist> findByStatus(Integer status);
    List<Specialist> findByExpertiseContaining(String expertise);
    List<Specialist> findByLevel(String level);
}
