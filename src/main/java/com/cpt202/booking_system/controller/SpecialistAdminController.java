package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.SpecialistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
public class SpecialistAdminController {

    @Autowired
    private SpecialistRepository specialistRepository;

    @GetMapping("/api/admin/specialists/pending")
    public List<Specialist> getPendingSpecialists() {
        return specialistRepository.findByApprovalStatus("PENDING");
    }

    @GetMapping("/api/admin/specialists/all")
    public List<Specialist> getAllSpecialists() {
        return specialistRepository.findAll();
    }

    @PutMapping("/api/admin/specialists/{id}/approve")
    public Specialist approveSpecialist(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Specialist specialist = specialistRepository.findById(id).orElseThrow();
        specialist.setLevel((String) body.get("level"));
        specialist.setFee(new BigDecimal(body.get("fee").toString()));
        specialist.setApprovalStatus("APPROVED");
        specialist.setStatus(1);
        return specialistRepository.save(specialist);
    }

    @PutMapping("/api/admin/specialists/{id}/reject")
    public Map<String, String> rejectSpecialist(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).orElseThrow();
        specialist.setApprovalStatus("REJECTED");
        specialist.setStatus(0);
        specialistRepository.save(specialist);
        return Map.of("message", "Specialist rejected");
    }

    @PutMapping("/api/admin/specialists/{id}/level")
    public Specialist updateLevelAndFee(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Specialist specialist = specialistRepository.findById(id).orElseThrow();
        if (body.containsKey("level")) specialist.setLevel((String) body.get("level"));
        if (body.containsKey("fee")) specialist.setFee(new BigDecimal(body.get("fee").toString()));
        return specialistRepository.save(specialist);
    }
}
