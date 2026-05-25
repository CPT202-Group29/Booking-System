package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Customer;
import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.entity.User;
import com.cpt202.booking_system.repository.CustomerRepository;
import com.cpt202.booking_system.repository.SpecialistRepository;
import com.cpt202.booking_system.repository.UserRepository;
import com.cpt202.booking_system.service.VerificationCodeService;
import com.cpt202.booking_system.util.JwtTokenUtil;
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
    @Autowired
    private VerificationCodeService verificationCodeService;

    @Autowired
    private SpecialistRepository specialistRepository;

    // ===================== Email Verification =====================

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        verificationCodeService.generateAndStore(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("message", "Verification code sent (check server console)"));
    }

    @PostMapping("/send-reset-code")
    public ResponseEntity<?> sendResetCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();
        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email not registered"));
        }
        verificationCodeService.generateAndStore(email);
        return ResponseEntity.ok(Map.of("message", "Reset code sent (check server console)"));
    }

    // ===================== Register =====================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String code = body.get("verificationCode");

        if (email == null || password == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, password and verification code are required"));
        }
        email = email.trim().toLowerCase();

        if (!verificationCodeService.validate(email, code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification code"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        User user = new User();
        user.setUsername(email); // use email as username for JWT
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ROLE_CUSTOMER");
        userRepository.save(user);

        // Auto create customer profile with name
        Customer customer = new Customer();
        customer.setUser(user);
        if (name != null && !name.isBlank()) {
            customer.setName(name.trim());
        }
        customerRepository.save(customer);

        verificationCodeService.remove(email);

        String token = jwtTokenUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(Map.of(
                "message", "Register successful",
                "token", token,
                "role", user.getRole(),
                "userId", user.getId()
        ));
    }

    // ===================== Login =====================

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
        email = email.trim().toLowerCase();

        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
        if (!passwordEncoder.matches(password, existingUser.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        Integer specialistId = null;

        // Specialist login: match by email in contact field
        if ("ROLE_SPECIALIST".equals(existingUser.getRole())) {
            String userEmail = existingUser.getEmail();
            Specialist specialist = specialistRepository.findAll().stream()
                .filter(s -> userEmail.equalsIgnoreCase(s.getContact()))
                .findFirst().orElse(null);
            if (specialist == null) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Specialist profile not found. Please contact admin."
                ));
            }
            if (!"APPROVED".equals(specialist.getApprovalStatus())) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Your specialist application is pending admin approval. Please wait for approval before logging in."
                ));
            }
            specialistId = specialist.getId();
        }

        String token = jwtTokenUtil.generateToken(existingUser.getUsername());
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("message", "Login successful");
        resp.put("token", token);
        resp.put("role", existingUser.getRole());
        resp.put("userId", existingUser.getId());
        if (specialistId != null) {
            resp.put("specialistId", specialistId);
        }
        return ResponseEntity.ok(resp);
    }

    // ===================== Specialist Register =====================

    @PostMapping("/register/specialist")
    public ResponseEntity<?> registerSpecialist(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String code = body.get("verificationCode");
        String expertise = body.get("expertise");

        if (email == null || password == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, password and verification code are required"));
        }
        email = email.trim().toLowerCase();
        if (!verificationCodeService.validate(email, code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification code"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        User user = new User();
        user.setUsername(email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ROLE_SPECIALIST");
        userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(user);
        if (name != null && !name.isBlank()) customer.setName(name.trim());
        customerRepository.save(customer);

        // Create specialist record pending admin approval
        Specialist specialist = new Specialist();
        specialist.setName(name != null ? name.trim() : email);
        specialist.setExpertise(expertise != null ? expertise : "");
        specialist.setLevel("Junior");
        specialist.setFee(new java.math.BigDecimal("50.00"));
        specialist.setContact(email);
        specialist.setUserId(user.getId().intValue());
        specialist.setApprovalStatus("PENDING");
        specialist.setStatus(0);
        specialistRepository.save(specialist);

        verificationCodeService.remove(email);
        return ResponseEntity.ok(Map.of(
                "message", "Application submitted! Please wait for admin approval."
        ));
    }

    // ===================== Change Password =====================

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (email == null || oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields required"));
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Incorrect old password"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed"));
    }

    // ===================== Reset Password =====================

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("verificationCode");
        String newPassword = body.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, code and new password are required"));
        }
        email = email.trim().toLowerCase();

        if (!verificationCodeService.validate(email, code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification code"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        verificationCodeService.remove(email);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    // ===================== Password & Account (legacy) =====================

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
            customerOpt.ifPresent(c -> customerRepository.delete(c));
            userRepository.deleteById(userId);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }
}
