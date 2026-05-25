package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.SpecialistRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/specialists")
public class SpecialistController {

    @Autowired
    private SpecialistRepository specialistRepository;

    @GetMapping
    public ResponseEntity<List<Specialist>> getAllSpecialists(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status) {

        List<Specialist> all = specialistRepository.findAll();
        // Filter in code (more flexible than QBE)
        List<Specialist> result = all.stream()
            .filter(s -> name == null || name.isBlank() || (s.getName() != null && s.getName().toLowerCase().contains(name.toLowerCase())))
            .filter(s -> expertise == null || expertise.isBlank() || expertise.equals(s.getExpertise()))
            .filter(s -> level == null || level.isBlank() || level.equals(s.getLevel()))
            .filter(s -> status == null || status.equals(s.getStatus()))
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSpecialistById(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);
        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Specialist not found: " + id));
        }
        return ResponseEntity.ok(specialist);
    }

    @PostMapping
    public ResponseEntity<Specialist> createSpecialist(@Valid @RequestBody Specialist specialist) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(specialistRepository.save(specialist));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSpecialist(@PathVariable Integer id,
                                              @Valid @RequestBody Specialist specialistDetails) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);
        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Specialist not found: " + id));
        }
        specialist.setName(specialistDetails.getName());
        specialist.setExpertise(specialistDetails.getExpertise());
        specialist.setLevel(specialistDetails.getLevel());
        specialist.setFee(specialistDetails.getFee());
        specialist.setContact(specialistDetails.getContact());
        specialist.setDescription(specialistDetails.getDescription());
        specialist.setStatus(specialistDetails.getStatus());
        return ResponseEntity.ok(specialistRepository.save(specialist));
    }

    @GetMapping("/{id}/fee")
    public ResponseEntity<?> getSpecialistFee(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);
        if (specialist == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("fee", specialist.getFee()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);
        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Specialist not found: " + id));
        }
        if (body.containsKey("status")) {
            specialist.setStatus(((Number) body.get("status")).intValue());
        }
        return ResponseEntity.ok(specialistRepository.save(specialist));
    }
}
