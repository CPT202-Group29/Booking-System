package com.booking.controller;

import com.booking.entity.User;
import com.booking.repository.UserRepository;
import com.booking.util.JwtTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenUtil jwtTokenUtil;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authController = new AuthController();
        authController.userRepository = userRepository;
        authController.passwordEncoder = passwordEncoder;
        authController.jwtTokenUtil = jwtTokenUtil;
    }

    // ========== 正常值测试 ==========

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
    void testLoginSuccess() {
        User user = new User();
        user.setEmail("user@test.com");
        user.setPasswordHash(passwordEncoder.encode("abc123456"));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtTokenUtil.generateToken("user@test.com")).thenReturn("token-login");

        ResponseEntity<?> resp = authController.login(
                Map.of("email", "user@test.com", "password", "abc123456"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    // ========== 边界值测试 ==========

    @Test
    void testLoginExactFiveFailuresLock() {
        User user = new User();
        user.setEmail("user5@test.com");
        user.setPasswordHash(passwordEncoder.encode("123456"));
        user.setFailedAttempts(4); // 已经失败4次
        when(userRepository.findByEmail("user5@test.com")).thenReturn(Optional.of(user));

        // 第5次失败应锁定
        ResponseEntity<?> resp = authController.login(
                Map.of("email", "user5@test.com", "password", "wrong"));
        assertEquals(HttpStatus.LOCKED, resp.getStatusCode());
    }

    // ========== 异常值测试 ==========

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
        user.setFailedAttempts(0);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = authController.login(
                Map.of("email", "user@test.com", "password", "wrongpassword"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void testRegisterMissingEmail() {
        ResponseEntity<?> resp = authController.register(
                Map.of("name", "NoEmail", "password", "123456"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void testResetPasswordInvalidCode() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        // 尝试用不存在的验证码重置密码
        ResponseEntity<?> resp = authController.resetPassword(
                Map.of("email", "user@test.com", "code", "000000", "newPassword", "abc123456"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertTrue(resp.getBody().toString().contains("Invalid or expired"));
    }
}
