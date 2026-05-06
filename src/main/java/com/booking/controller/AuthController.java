package com.booking.controller;

import com.booking.entity.Customer;
import com.booking.entity.User;
import com.booking.repository.CustomerRepository;
import com.booking.repository.UserRepository;
import com.booking.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    
    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        // Default role: ROLE_CUSTOMER
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("ROLE_CUSTOMER");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        String token = jwtTokenUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(Map.of(
                "message", "Register successful",
                "token", token,
                "role", user.getRole(),
                "userId", user.getId()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User existingUser = userRepository.findByUsername(user.getUsername()).orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        if (!passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        String token = jwtTokenUtil.generateToken(existingUser.getUsername());
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "role", existingUser.getRole(),
                "userId", existingUser.getId()
        ));
    }

    
    @PutMapping("/user/{userId}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }

    
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
        
            Optional<Customer> customerOpt = customerRepository.findByUserId(userId);
            customerOpt.ifPresent(customer -> customerRepository.delete(customer));
            
            
            userRepository.deleteById(userId);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }
}