package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.entity.User;
import com.cpt202.booking_system.repository.UserRepository;
import com.cpt202.booking_system.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class FileUploadController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    private String getEmailFromToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        try { return jwtTokenUtil.extractUsername(token); }
        catch (Exception e) { return null; }
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String email = getEmailFromToken(request);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        if (file.getSize() > MAX_FILE_SIZE) return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 2MB limit"));
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            User user = userOpt.get();
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUri = "data:" + file.getContentType() + ";base64," + base64;
            user.setAvatarUrl(dataUri);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Avatar uploaded", "avatar", dataUri));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to process file: " + e.getMessage()));
        }
    }
}
