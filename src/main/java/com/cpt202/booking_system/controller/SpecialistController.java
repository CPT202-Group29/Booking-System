package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.repository.SpecialistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/specialists")
public class SpecialistController {

    @Autowired
    private SpecialistRepository specialistRepository;

    // 获取所有专家（支持根据条件动态筛选）
    @GetMapping
    public List<Specialist> getAllSpecialists(
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status) {

        // 创建一个“探测器”对象，把前端传来的搜索条件塞进去
        Specialist probe = new Specialist();
        probe.setExpertise(expertise);
        probe.setLevel(level);
        probe.setStatus(status);

        // 使用 Spring 提供的高级魔法：按例查询 (Query by Example)
        // 它会自动忽略没有填写的条件，只查有匹配项的数据！
        org.springframework.data.domain.Example<Specialist> example = org.springframework.data.domain.Example.of(probe);
        
        return specialistRepository.findAll(example);
    }

    @GetMapping("/{id}")
    public Specialist getSpecialistById(@PathVariable Integer id) {
        return specialistRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Specialist createSpecialist(@RequestBody Specialist specialist) {
        return specialistRepository.save(specialist);
    }

    @PutMapping("/{id}")
    public Specialist updateSpecialist(@PathVariable Integer id, @RequestBody Specialist specialistDetails) {
        Specialist specialist = specialistRepository.findById(id).orElseThrow();
        specialist.setName(specialistDetails.getName());
        specialist.setExpertise(specialistDetails.getExpertise());
        specialist.setLevel(specialistDetails.getLevel());
        specialist.setFee(specialistDetails.getFee());
        specialist.setContact(specialistDetails.getContact());
        specialist.setDescription(specialistDetails.getDescription());
        specialist.setStatus(specialistDetails.getStatus());
        return specialistRepository.save(specialist);
    }

    @PatchMapping("/{id}/status")
    public Specialist updateStatus(@PathVariable Integer id, @RequestBody Integer status) {
        Specialist specialist = specialistRepository.findById(id).orElseThrow();
        specialist.setStatus(status);
        return specialistRepository.save(specialist);
    }
}