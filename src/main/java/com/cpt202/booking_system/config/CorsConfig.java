package com.cpt202.booking_system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 允许所有接口被跨域访问
                .allowedOriginPatterns("*") // 允许所有前端地址（A2/A3的本地地址）
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") // 允许我们写的所有动作
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}