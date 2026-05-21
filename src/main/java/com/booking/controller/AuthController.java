package com.booking.controller;

import com.booking.entity.Specialist;
import com.booking.entity.User;
import com.booking.repository.SpecialistRepository;
import com.booking.repository.UserRepository;
import com.booking.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SpecialistRepository specialistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    // store verification codes in memory
    private final Map<String, String> codeStore = new ConcurrentHashMap<>();

    // ===== Customer Register =====
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");

        // check required fields
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        // check email not already used
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        // create the new user
        User user = new User();
        user.setUsername(name != null ? name : email);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("CUSTOMER");
        user.setFailedAttempts(0);
        userRepository.save(user);

        // generate and return token
        String token = jwtTokenUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Registration successful",
                "role", "CUSTOMER"
        ));
    }

    // ===== Specialist Register =====
    // After registering, admin needs to approve before specialist can login
    @PostMapping("/register/specialist")
    public ResponseEntity<?> registerSpecialist(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String expertise = request.get("expertise");

        // check all required fields
        if (email == null || password == null || name == null || expertise == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, password and expertise are required"));
        }

        // check email not already used
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        // create user account with SPECIALIST role
        User user = new User();
        user.setUsername(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("SPECIALIST");
        user.setFailedAttempts(0);
        User savedUser = userRepository.save(user);

        // create specialist profile - status is PENDING until admin approves
        Specialist specialist = new Specialist();
        specialist.setUserId(savedUser.getUserId());
        specialist.setName(name);
        specialist.setExpertise(expertise);
        specialist.setApprovalStatus("PENDING");
        specialist.setStatus(0);
        specialistRepository.save(specialist);

        return ResponseEntity.ok(Map.of("message", "Registration submitted. Please wait for admin approval."));
    }

    // ===== Login (works for all roles: CUSTOMER, SPECIALIST, ADMIN) =====
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        // find user by email
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
        }

        User user = optionalUser.get();

        // check if account is locked
        if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            return ResponseEntity.status(423).body(Map.of("error", "Account locked. Please try again later."));
        }

        // check password is correct
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            // add to failed attempts counter
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            // lock account after 5 failed attempts
            if (user.getFailedAttempts() >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                user.setFailedAttempts(0);
                userRepository.save(user);
                return ResponseEntity.status(423).body(Map.of("error", "Account locked for 15 minutes due to too many failed attempts."));
            }
            userRepository.save(user);
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
        }

        // login successful - reset failed attempts
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // build the user info to return
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userId", user.getUserId());
        userInfo.put("email", user.getEmail());
        userInfo.put("username", user.getUsername());
        userInfo.put("role", user.getRole());
        userInfo.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userInfo.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");

        // if specialist, also include their specialistId and approval status
        if ("SPECIALIST".equals(user.getRole())) {
            Optional<Specialist> specialist = specialistRepository.findByUserId(user.getUserId());
            if (specialist.isPresent()) {
                userInfo.put("specialistId", specialist.get().getId());
                userInfo.put("approvalStatus", specialist.get().getApprovalStatus());
            }
        }

        String token = jwtTokenUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Login successful",
                "user", userInfo
        ));
    }

    // ===== Change Password =====
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (email == null || oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, old password and new password are required"));
        }

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        User user = optionalUser.get();
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Old password is incorrect"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // ===== Send Verification Code =====
    @PostMapping("/send-code")
    public ResponseEntity<?> sendVerificationCode(@RequestParam String email) {
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }
        // generate a random 6-digit code
        String code = String.format("%06d", new Random().nextInt(1000000));
        codeStore.put(email, code);
        // in real system this would send an email - for now just print
        System.out.println("Verification code for " + email + ": " + code);
        return ResponseEntity.ok(Map.of("message", "Verification code sent"));
    }

    // ===== Send Reset Code =====
    @PostMapping("/send-reset-code")
    public ResponseEntity<?> sendResetCode(@RequestParam String email) {
        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email not registered"));
        }
        String code = String.format("%06d", new Random().nextInt(1000000));
        codeStore.put(email, code);
        System.out.println("Reset code for " + email + ": " + code);
        return ResponseEntity.ok(Map.of("message", "Reset code sent"));
    }

    // ===== Reset Password =====
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, code and new password are required"));
        }

        // check the code matches what we stored
        String storedCode = codeStore.get(email);
        if (storedCode == null || !storedCode.equals(code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification code"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        codeStore.remove(email);
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    // ===== Health Check =====
    @GetMapping("/test")
    public String test() {
        return "Auth backend is running!";
    }
}
