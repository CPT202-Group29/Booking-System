package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.Customer;
import com.cpt202.booking_system.entity.User;
import com.cpt202.booking_system.repository.CustomerRepository;
import com.cpt202.booking_system.repository.UserRepository;
import com.cpt202.booking_system.service.CaptchaService;
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
    private CaptchaService captchaService;
    @Autowired
    private VerificationCodeService verificationCodeService;

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

        String token = jwtTokenUtil.generateToken(existingUser.getUsername());
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "role", existingUser.getRole(),
                "userId", existingUser.getId()
        ));
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
