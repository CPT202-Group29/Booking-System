package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.model.TimeSlot;
import com.cpt202.booking_system.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/timeslots")
public class TimeSlotController {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @GetMapping
    public ResponseEntity<List<TimeSlot>> getSlots(
            @RequestParam(required = false) Long specialistId) {
        if (specialistId != null) {
            return ResponseEntity.ok(
                timeSlotRepository
                    .findBySpecialistIdAndIsAvailableTrue(specialistId));
        }
        return ResponseEntity.ok(timeSlotRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSlotById(@PathVariable Long id) {
        return timeSlotRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TimeSlot> createSlot(
            @RequestBody TimeSlot slot) {
        slot.setIsAvailable(true);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(timeSlotRepository.save(slot));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long id) {
        if (!timeSlotRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Slot not found: " + id));
        }
        timeSlotRepository.deleteById(id);
        return ResponseEntity.ok(
            Map.of("message", "Slot deleted successfully"));
    }
}