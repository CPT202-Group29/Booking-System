package com.cpt202.booking_system.repository;

import com.cpt202.booking_system.entity.Specialist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecialistRepository extends JpaRepository<Specialist, Integer> {
}