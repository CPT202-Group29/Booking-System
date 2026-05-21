package com.booking.controller;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

// This controller handles admin actions for specialist management
// Admin can view, approve, and reject specialist registration requests
@RestController
public class SpecialistAdminController {

    @Autowired
    private SpecialistRepository specialistRepository;

    // Get all specialists who are waiting for admin approval
    @GetMapping("/api/admin/specialists/pending")
    public List<Specialist> getPendingSpecialists() {
        return specialistRepository.findByApprovalStatus("PENDING");
    }

    // Get all specialists regardless of approval status
    @GetMapping("/api/admin/specialists/all")
    public List<Specialist> getAllSpecialists() {
        return specialistRepository.findAll();
    }

    // Approve a specialist - admin also sets their level and fee
    @PutMapping("/api/admin/specialists/{id}/approve")
    public Specialist approveSpecialist(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {

        Specialist specialist = specialistRepository.findById(id).get();

        // set the level and fee decided by admin
        specialist.setLevel((String) body.get("level"));
        specialist.setFee(new BigDecimal(body.get("fee").toString()));

        // mark as approved and make available
        specialist.setApprovalStatus("APPROVED");
        specialist.setStatus(1);

        return specialistRepository.save(specialist);
    }

    // Reject a specialist application
    @PutMapping("/api/admin/specialists/{id}/reject")
    public Map<String, String> rejectSpecialist(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).get();
        specialist.setApprovalStatus("REJECTED");
        specialist.setStatus(0);
        specialistRepository.save(specialist);
        return Map.of("message", "Specialist rejected");
    }

    // Update specialist level or fee after approval
    @PutMapping("/api/admin/specialists/{id}/level")
    public Specialist updateLevelAndFee(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {

        Specialist specialist = specialistRepository.findById(id).get();

        if (body.containsKey("level")) {
            specialist.setLevel((String) body.get("level"));
        }
        if (body.containsKey("fee")) {
            specialist.setFee(new BigDecimal(body.get("fee").toString()));
        }

        return specialistRepository.save(specialist);
    }
}
