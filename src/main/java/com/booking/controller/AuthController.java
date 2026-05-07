package com.booking.controller;

import com.booking.entity.User;
import com.booking.repository.UserRepository;
import com.booking.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    // 简单内存存储验证码（生产环境应使用 Redis 或数据库）
    private final Map<String, String> codeStore = new HashMap<>();

    /** 用户注册 */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }
        User user = new User();
        user.setUsername(name != null ? name : email);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("CUSTOMER");
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        String token = jwtTokenUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of("token", token, "message", "Registration successful"));
    }

    /** 用户登录 */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
        }
        User user = optionalUser.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
        }
        String token = jwtTokenUtil.generateToken(user.getEmail());
        // 返回 token 和简单的用户信息
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Login successful",
                "user", Map.of(
                        "userId", user.getUserId(),
                        "email", user.getEmail(),
                        "username", user.getUsername(),
                        "role", user.getRole(),
                        "phone", user.getPhone() != null ? user.getPhone() : "",
                        "avatar", user.getAvatar() != null ? user.getAvatar() : ""
                )
        ));
    }

    /** 修改密码 */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        
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

    /** 发送验证码（注册场景） */
    @PostMapping("/send-code")
    public ResponseEntity<?> sendVerificationCode(@RequestParam String email) {
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }
        String code = String.format("%06d", new Random().nextInt(1000000));
        codeStore.put(email, code);
        System.out.println("Verification code for " + email + ": " + code);
        return ResponseEntity.ok(Map.of("message", "Verification code sent"));
    }

    /** 发送重置密码验证码 */
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

    /** 重置密码 */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, code and new password are required"));
        }
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

    /** 健康检查 */
    @GetMapping("/test")
    public String test() {
        return "Auth backend is running!";
    }
}
