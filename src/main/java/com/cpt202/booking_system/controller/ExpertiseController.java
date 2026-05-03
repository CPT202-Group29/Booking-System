package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Expertise;
import com.cpt202.booking_system.repository.ExpertiseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/expertise")
public class ExpertiseController {

    @Autowired
    private ExpertiseRepository expertiseRepository;

    // 1. 获取所有专业列表 (GET)
    @GetMapping
    public List<Expertise> getAllExpertise() {
        return expertiseRepository.findAll();
    }

    // 2. 新增专业 (POST)
    @PostMapping
    public Expertise createExpertise(@RequestBody Expertise expertise) {
        if (expertise.getUsedBy() == null) {
            expertise.setUsedBy(0); // 默认没人用
        }
        return expertiseRepository.save(expertise);
    }

    // 3. 全面修改专业信息 (PUT)
    @PutMapping("/{id}")
    public Expertise updateExpertise(@PathVariable Integer id, @RequestBody Expertise details) {
        Expertise expertise = expertiseRepository.findById(id).orElseThrow();
        expertise.setExpertiseName(details.getExpertiseName());
        expertise.setDescription(details.getDescription());
        expertise.setStatus(details.getStatus());
        expertise.setUsedBy(details.getUsedBy());
        return expertiseRepository.save(expertise);
    }

    // 4. 仅修改状态 (PATCH) - 接收 {"status": "Inactive"} 格式
    @PatchMapping("/{id}/status")
    public Expertise updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> updates) {
        Expertise expertise = expertiseRepository.findById(id).orElseThrow();
        if(updates.containsKey("status")) {
            expertise.setStatus(updates.get("status"));
        }
        return expertiseRepository.save(expertise);
    }
}
