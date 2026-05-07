package com.booking.controller;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
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
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status) {

        Specialist probe = new Specialist();
        probe.setExpertise(expertise);
        probe.setLevel(level);
        probe.setStatus(status);

        Example<Specialist> example = Example.of(probe);
        return ResponseEntity.ok(specialistRepository.findAll(example));
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
