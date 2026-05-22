package com.booking.controller;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import com.booking.repository.TimeSlotRepository;
import com.booking.service.ChargeCalculationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/specialists")
public class SpecialistController {

    @Autowired
    private SpecialistRepository specialistRepository;

    @Autowired
    private ChargeCalculationService feeService;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    /** 查询专家列表，支持多条件筛选 + 分页 + 时间段可用性过滤 */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSpecialists(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) BigDecimal minFee,
            @RequestParam(required = false) BigDecimal maxFee,
            @RequestParam(required = false) String availableFrom,
            @RequestParam(required = false) String availableTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Specialist probe = new Specialist();
        probe.setExpertise(expertise);
        probe.setLevel(level);
        probe.setStatus(status);

        ExampleMatcher matcher = ExampleMatcher.matching()
            .withIgnorePaths("id", "fee", "contact", "description", "userId", "approvalStatus");
        if (name != null && !name.isEmpty()) {
            probe.setName(name);
            matcher = matcher.withMatcher("name",
                    ExampleMatcher.GenericPropertyMatchers.contains().ignoreCase());
        } else {
            matcher = matcher.withIgnorePaths("name");
        }

        Example<Specialist> example = Example.of(probe, matcher);
        List<Specialist> results = specialistRepository.findAll(example);   

        // only show approved specialists to customers
        results = results.stream()
        .filter(s -> "APPROVED".equals(s.getApprovalStatus()))
        .collect(Collectors.toList());

        // 费用范围过滤
        if (minFee != null || maxFee != null) {
            results = results.stream()
                    .filter(s -> {
                        if (s.getFee() == null) return false;
                        boolean minOk = (minFee == null || s.getFee().compareTo(minFee) >= 0);
                        boolean maxOk = (maxFee == null || s.getFee().compareTo(maxFee) <= 0);
                        return minOk && maxOk;
                    })
                    .collect(Collectors.toList());
        }

        // 时间段可用性过滤
        if (availableFrom != null && !availableFrom.isEmpty() && availableTo != null && !availableTo.isEmpty()) {
            try {
                LocalDateTime from = LocalDateTime.parse(availableFrom);
                LocalDateTime to = LocalDateTime.parse(availableTo);
                List<Long> availableIds = timeSlotRepository
                        .findSpecialistIdsWithAvailableSlotInRange(from, to);
                Set<Long> idSet = new HashSet<>(availableIds);
                results = results.stream()
                        .filter(s -> idSet.contains(Long.valueOf(s.getId())))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                // 日期解析失败时忽略该筛选条件
            }
        }

        // 手动分页
        int totalElements = results.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Specialist> pageContent = (fromIndex < totalElements)
                ? results.subList(fromIndex, toIndex)
                : new ArrayList<>();

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageContent);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("pageSize", size);
        return ResponseEntity.ok(response);
    }

    /** 根据 ID 查询单个专家 */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSpecialistById(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);

    // return 404 if not found or not approved
        if (specialist == null || !"APPROVED".equals(specialist.getApprovalStatus())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Specialist not found: " + id));
        }

        return ResponseEntity.ok(specialist);
    }

    /** 获取某专家的预估咨询费用 */
    @GetMapping("/{id}/fee")
    public ResponseEntity<?> getBookingFee(@PathVariable Integer id) {
        try {
            BigDecimal fee = feeService.calculateCharge(Long.valueOf(id));
            return ResponseEntity.ok(Map.of(
                    "specialistId", id,
                    "bookingFee", fee.toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to calculate fee: " + e.getMessage()));
        }
    }

    /** 创建新专家 */
    @PostMapping
    public ResponseEntity<Specialist> createSpecialist(@Valid @RequestBody Specialist specialist) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(specialistRepository.save(specialist));
    }

    /** 更新专家信息 */
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

    /** 修改专家状态 */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestBody Map<String, Object> body) {
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
