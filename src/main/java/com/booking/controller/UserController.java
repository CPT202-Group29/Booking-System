package com.booking.controller;

import com.booking.entity.User;
import com.booking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    /** 获取当前登录用户的个人信息 */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();   // JWT subject 是 email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        // 只返回安全信息，不暴露密码哈希等字段
        return ResponseEntity.ok(Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "role", user.getRole()
        ));
    }

    /** 更新当前用户的姓名和电话 */
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(@RequestBody Map<String, String> updates,
                                               Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        if (updates.containsKey("name")) {
            user.setUsername(updates.get("name"));
        }
        if (updates.containsKey("phone")) {
            String phone = updates.get("phone");
            if (phone != null && !phone.matches("\\d{10,15}") && !phone.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid phone number format"));
            }
            user.setPhone(phone);
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    /** 删除当前账户（需提供密码确认） */
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(@RequestBody Map<String, String> request,
                                               Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        String password = request.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(403).body(Map.of("error", "Incorrect password"));
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Account deleted"));
    }
}
