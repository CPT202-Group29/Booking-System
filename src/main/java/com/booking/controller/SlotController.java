package com.booking.controller;

import com.booking.model.TimeSlot;
import com.booking.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/slots")
public class SlotController {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    /** 获取所有时间段（用于管理页面列表） */
    @GetMapping("/all")
    public ResponseEntity<List<TimeSlot>> getAllSlots() {
        return ResponseEntity.ok(timeSlotRepository.findAll());
    }

    /** 创建时间段（含重叠检测） */
    @PostMapping
    public ResponseEntity<?> createSlot(@RequestBody TimeSlot slot) {
        if (slot.getStartTime() == null || slot.getEndTime() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start time and end time are required"));
        }
        if (slot.getStartTime().isAfter(slot.getEndTime()) || slot.getStartTime().equals(slot.getEndTime())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start time must be before end time"));
        }
        if (slot.getSpecialistId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Specialist ID is required"));
        }
        // 重叠检测
        if (timeSlotRepository.existsOverlappingSlot(slot.getSpecialistId(), slot.getStartTime(), slot.getEndTime())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Time slot overlaps with an existing slot for this specialist"));
        }
        slot.setIsAvailable(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotRepository.save(slot));
    }

    /** 更新时间段（含重叠检测，排除自身） */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSlot(@PathVariable Long id, @RequestBody TimeSlot updates) {
        Optional<TimeSlot> existing = timeSlotRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Time slot not found: " + id));
        }
        TimeSlot slot = existing.get();
        if (updates.getStartTime() != null) slot.setStartTime(updates.getStartTime());
        if (updates.getEndTime() != null) slot.setEndTime(updates.getEndTime());
        if (updates.getSpecialistId() != null) slot.setSpecialistId(updates.getSpecialistId());
        if (updates.getIsAvailable() != null) slot.setIsAvailable(updates.getIsAvailable());

        if (slot.getStartTime() != null && slot.getEndTime() != null &&
                !slot.getStartTime().isBefore(slot.getEndTime())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start time must be before end time"));
        }
        // 重叠检测（排除自身）
        if (timeSlotRepository.existsOverlappingSlotExcludingId(
                slot.getSpecialistId(), slot.getStartTime(), slot.getEndTime(), id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Updated time slot overlaps with another existing slot"));
        }
        return ResponseEntity.ok(timeSlotRepository.save(slot));
    }

    /** 删除时间段（带预约保护） */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long id) {
        Optional<TimeSlot> optionalSlot = timeSlotRepository.findById(id);
        if (optionalSlot.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Time slot not found: " + id));
        }
        TimeSlot slot = optionalSlot.get();
        if (!slot.getIsAvailable()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Cannot delete time slot that is currently booked or unavailable"));
        }
        timeSlotRepository.delete(slot);
        return ResponseEntity.ok(Map.of("message", "Time slot deleted"));
    }
}
