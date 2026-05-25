package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.User;
import com.cpt202.booking_system.repository.UserRepository;
import com.cpt202.booking_system.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    private String getEmailFromToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try {
            return jwtTokenUtil.extractUsername(token);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String email = getEmailFromToken(request);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        User user = userOpt.get();
        return ResponseEntity.ok(Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "role", user.getRole()
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(@RequestBody Map<String, String> updates, HttpServletRequest request) {
        String email = getEmailFromToken(request);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        User user = userOpt.get();
        if (updates.containsKey("name")) user.setUsername(updates.get("name"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String email = getEmailFromToken(servletRequest);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.get("password"), user.getPassword())) {
            return ResponseEntity.status(403).body(Map.of("error", "Incorrect password"));
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Account deleted"));
    }
}
