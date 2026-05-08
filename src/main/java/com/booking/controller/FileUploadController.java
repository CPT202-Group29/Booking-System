package com.booking.controller;

import com.booking.entity.User;
import com.booking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class FileUploadController {

    @Autowired
    private UserRepository userRepository;

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif"};

    /** 上传头像 */
    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file,
                                          Authentication authentication) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 2MB limit"));
        }
        String contentType = file.getContentType();
        boolean allowed = false;
        for (String type : ALLOWED_TYPES) {
            if (type.equals(contentType)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only JPG, PNG, GIF files are allowed"));
        }

        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            // 将图片转为 Base64 字符串存储
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUri = "data:" + contentType + ";base64," + base64;
            user.setAvatar(dataUri);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Avatar uploaded", "avatar", dataUri));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to process file: " + e.getMessage()));
        }
    }
}
