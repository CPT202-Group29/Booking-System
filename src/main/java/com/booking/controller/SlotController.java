package com.booking.controller;

import com.booking.model.TimeSlot;
import com.booking.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/slots")
public class SlotController {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    /** 查询可用时间段 */
    @GetMapping
    public ResponseEntity<List<TimeSlot>> getSlots(
            @RequestParam(required = false) Long specialistId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        
        if (specialistId != null && from != null && to != null) {
            return ResponseEntity.ok(
                    timeSlotRepository.findAvailableSlotsBySpecialistAndDateRange(specialistId, from, to));
        } else if (specialistId != null) {
            return ResponseEntity.ok(
                    timeSlotRepository.findBySpecialistIdAndIsAvailableTrue(specialistId));
        }
        // 如果没有筛选条件，返回全部（可能数据量大，谨慎使用，这里暂且返回全部）
        return ResponseEntity.ok(timeSlotRepository.findAll());
    }

    /** 创建时间段 */
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
        slot.setIsAvailable(true); // 默认可用
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotRepository.save(slot));
    }

    /** 更新时间段 */
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
        
        // 简单验证时间合法性
        if (slot.getStartTime() != null && slot.getEndTime() != null &&
                !slot.getStartTime().isBefore(slot.getEndTime())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start time must be before end time"));
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
        // 检查是否有活跃的预约关联此槽位
        // 这里的预约检查可借助 BookingRepository，但为了简单，暂时仅检查 isAvailable 是否为 false（表示可能已被预约）
        // 实际项目中应查询 booking 表确认。
        if (!slot.getIsAvailable()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Cannot delete time slot that is currently booked or unavailable"));
        }
        timeSlotRepository.delete(slot);
        return ResponseEntity.ok(Map.of("message", "Time slot deleted"));
    }
}
