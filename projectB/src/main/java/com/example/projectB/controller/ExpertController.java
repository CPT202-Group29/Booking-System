package com.example.projectB.controller;

import com.example.projectB.entity.Expert;
import com.example.projectB.repository.ExpertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/experts")
public class ExpertController {

    @Autowired
    private ExpertRepository expertRepository;

   
    @GetMapping("/list")
    public ResponseEntity<List<Expert>> getAllExperts() {
        return ResponseEntity.ok(expertRepository.findAll());
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getExpertById(@PathVariable Long id) {
        Optional<Expert> expert = expertRepository.findById(id);
        if (expert.isPresent()) {
            return ResponseEntity.ok(expert.get()); 
        } else {
            return ResponseEntity.status(404).body("Expert not found"); 
        }
    }


    @PostMapping("/create")
    public ResponseEntity<?> createExpert(@RequestBody Expert expert) {
        expertRepository.save(expert);
        return ResponseEntity.ok("Expert created successfully!");
    }

    
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateExpert(@PathVariable Long id, @RequestBody Expert updatedExpert) {
        Optional<Expert> optionalExpert = expertRepository.findById(id);

        if (!optionalExpert.isPresent()) {
            return ResponseEntity.status(404).body("Expert not found");
        }

        Expert expert = optionalExpert.get();

       
        expert.setName(updatedExpert.getName());
        expert.setExpertise(updatedExpert.getExpertise());
        expert.setLevel(updatedExpert.getLevel());
        expert.setFee(updatedExpert.getFee());
        expert.setStatus(updatedExpert.getStatus());

       
        expert.setEmail(updatedExpert.getEmail());
        expert.setPhone(updatedExpert.getPhone());
        expert.setDescription(updatedExpert.getDescription());

        expertRepository.save(expert);
        return ResponseEntity.ok("Expert updated successfully!");
    }

   
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteExpert(@PathVariable Long id) {
        if (!expertRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Expert not found");
        }

        expertRepository.deleteById(id);
        return ResponseEntity.ok("Expert deleted successfully!");
    }
}