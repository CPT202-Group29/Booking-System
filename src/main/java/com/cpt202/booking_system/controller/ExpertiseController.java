package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Expertise;
import com.cpt202.booking_system.repository.ExpertiseRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/expertise")
public class ExpertiseController {

    @Autowired
    private ExpertiseRepository expertiseRepository;

    @GetMapping
    public ResponseEntity<List<Expertise>> getAllExpertise() {
        return ResponseEntity.ok(expertiseRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Expertise> createExpertise(@Valid @RequestBody Expertise expertise) {
        if (expertise.getUsedBy() == null) {
            expertise.setUsedBy(0);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(expertiseRepository.save(expertise));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpertise(@PathVariable Integer id,
                                             @Valid @RequestBody Expertise details) {
        Expertise expertise = expertiseRepository.findById(id).orElse(null);
        if (expertise == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Expertise not found: " + id));
        }
        expertise.setExpertiseName(details.getExpertiseName());
        expertise.setDescription(details.getDescription());
        expertise.setStatus(details.getStatus());
        expertise.setUsedBy(details.getUsedBy());
        return ResponseEntity.ok(expertiseRepository.save(expertise));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestBody Map<String, String> updates) {
        Expertise expertise = expertiseRepository.findById(id).orElse(null);
        if (expertise == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Expertise not found: " + id));
        }
        if (updates.containsKey("status")) {
            expertise.setStatus(updates.get("status"));
        }
        return ResponseEntity.ok(expertiseRepository.save(expertise));
    }
}
