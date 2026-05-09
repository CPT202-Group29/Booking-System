package com.booking.controller;
 
import com.booking.entity.User;
import com.booking.repository.UserRepository;
import com.booking.util.JwtTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenUtil jwtTokenUtil;

    @InjectMocks
    private AuthController authController;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // 手动注入 passwordEncoder，因为 AuthController 没有 setter
        // 使用反射设置私有字段
        try {
            java.lang.reflect.Field field = AuthController.class.getDeclaredField("passwordEncoder");
            field.setAccessible(true);
            field.set(authController, passwordEncoder);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testRegisterSuccess() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(new User());
        when(jwtTokenUtil.generateToken(anyString())).thenReturn("token-abc");

        ResponseEntity<?> resp = authController.register(
                Map.of("name", "Alice", "email", "new@test.com", "password", "abc123456"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    void testRegisterDuplicateEmail() {
        when(userRepository.existsByEmail("duplicate@test.com")).thenReturn(true);

        ResponseEntity<?> resp = authController.register(
                Map.of("name", "Bob", "email", "duplicate@test.com", "password", "123456"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void testLoginWrongPassword() {
        User user = new User();
        user.setEmail("user@test.com");
        user.setPasswordHash(passwordEncoder.encode("123456"));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = authController.login(
                Map.of("email", "user@test.com", "password", "wrong"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void testLoginSuccess() {
        User user = new User();
        user.setEmail("user@test.com");
        user.setPasswordHash(passwordEncoder.encode("123456"));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtTokenUtil.generateToken("user@test.com")).thenReturn("token-login");

        ResponseEntity<?> resp = authController.login(
                Map.of("email", "user@test.com", "password", "123456"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }
}
