package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.dto.ProfileResponse;
import com.cpt202.booking_system.entity.Customer;
import com.cpt202.booking_system.entity.User;
import com.cpt202.booking_system.repository.CustomerRepository;
import com.cpt202.booking_system.repository.UserRepository;
import com.cpt202.booking_system.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    @Autowired
    private SecurityUtil securityUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<?> getProfile() {
        Long userId = securityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Customer customer = customerRepository.findByUserId(userId).orElse(null);
        return ResponseEntity.ok(ProfileResponse.from(user, customer));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        Long userId = securityUtil.getCurrentUserId();
        Optional<Customer> opt = customerRepository.findByUserId(userId);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Profile not found"));
        }

        Customer customer = opt.get();
        if (body.containsKey("name")) customer.setName(body.get("name"));
        if (body.containsKey("phone")) customer.setPhone(body.get("phone"));
        if (body.containsKey("gender")) customer.setGender(body.get("gender"));
        if (body.containsKey("age")) customer.setAge(body.get("age") != null ? Integer.parseInt(body.get("age")) : null);
        if (body.containsKey("address")) customer.setAddress(body.get("address"));
        if (body.containsKey("avatarUrl")) customer.setAvatarUrl(body.get("avatarUrl"));

        customerRepository.save(customer);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
}
