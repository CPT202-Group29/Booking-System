package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.service.CaptchaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/captcha")
public class CaptchaController {

    @Autowired
    private CaptchaService captchaService;

    @GetMapping
    public ResponseEntity<?> getCaptcha() {
        CaptchaService.CaptchaResult result = captchaService.generate();
        return ResponseEntity.ok(Map.of(
                "captchaId", result.captchaId,
                "captchaImage", result.captchaImage
        ));
    }
}
