package com.example.projectB.repository;

import com.example.projectB.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
        Optional<Customer> findByUserId(Long userId);
}
