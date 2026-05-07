package com.booking.controller;

import com.booking.entity.Specialist;
import com.booking.repository.SpecialistRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/specialists")
public class SpecialistController {

    @Autowired
    private SpecialistRepository specialistRepository;

    /** 查询专家列表，支持多条件筛选 */
    @GetMapping
    public ResponseEntity<List<Specialist>> getAllSpecialists(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) BigDecimal minFee,
            @RequestParam(required = false) BigDecimal maxFee) {

        // 使用 QBE (Query By Example) 进行基础匹配
        Specialist probe = new Specialist();
        probe.setExpertise(expertise);
        probe.setLevel(level);
        probe.setStatus(status);

        ExampleMatcher matcher = ExampleMatcher.matching()
                .withIgnorePaths("id", "fee", "contact", "description");

        // 如果有 name 参数，启用模糊匹配（忽略大小写，包含即可）
        if (name != null && !name.isEmpty()) {
            probe.setName(name);
            matcher = matcher.withMatcher("name", 
                    ExampleMatcher.GenericPropertyMatchers.contains().ignoreCase());
        } else {
            matcher = matcher.withIgnorePaths("name");
        }

        Example<Specialist> example = Example.of(probe, matcher);
        List<Specialist> results = specialistRepository.findAll(example);

        // 手动过滤费用范围（QBE 不支持范围查询）
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

        return ResponseEntity.ok(results);
    }

    /** 根据 ID 查询单个专家 */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSpecialistById(@PathVariable Integer id) {
        Specialist specialist = specialistRepository.findById(id).orElse(null);
        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Specialist not found: " + id));
        }
        return ResponseEntity.ok(specialist);
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

    /** 修改专家状态（可用/不可用） */
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
