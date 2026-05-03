package com.example.projectB.controller;

import com.example.projectB.entity.User;
import com.example.projectB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
public String register(@RequestBody User user) {
    User existingUser = userRepository.findByUsername(user.getUsername()).orElse(null);

    if (existingUser != null) {
        return "Username already exists";
    }

    userRepository.save(user);
    return "Register successful";
}

    @PostMapping("/login")
public String login(@RequestBody User user) {

    User existingUser = userRepository.findByUsername(user.getUsername()).orElse(null);

    if (existingUser == null) {
        return "User not found";
    }

    if (!existingUser.getPassword().equals(user.getPassword())) {
        return "Incorrect password";
    }

    return "Login successful. Role: " + existingUser.getRole();
}
}