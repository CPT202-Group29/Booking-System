package com.example.projectB.controller;

import com.example.projectB.entity.Customer;
import com.example.projectB.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
        Optional<Customer> customer = customerRepository.findById(id);
        return customer.orElse(null);
    }

    @PostMapping
    public Customer createCustomer(@RequestBody Customer customer) {
        return customerRepository.save(customer);
    }

    @DeleteMapping("/{id}")
    public String deleteCustomer(@PathVariable Long id) {
        if (customerRepository.existsById(id)) {
            customerRepository.deleteById(id);
            return "Customer deleted successfully!";
        }
        return "Customer not found!";
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody Customer customerDetails) {
        Optional<Customer> optionalCustomer = customerRepository.findById(id);

        if (optionalCustomer.isPresent()) {
            Customer customer = optionalCustomer.get();
            if (customerDetails.getName() != null) customer.setName(customerDetails.getName());
            if (customerDetails.getPhone() != null) customer.setPhone(customerDetails.getPhone());
            if (customerDetails.getGender() != null) customer.setGender(customerDetails.getGender());
            if (customerDetails.getAge() != null) customer.setAge(customerDetails.getAge());
            if (customerDetails.getAddress() != null) customer.setAddress(customerDetails.getAddress());
           

            customerRepository.save(customer);
            return ResponseEntity.ok("Customer information updated successfully!");
        }

        return ResponseEntity.badRequest().body("Customer not found!");
    }

    
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<?> getCustomerByUserId(@PathVariable Long userId) {
        Optional<Customer> customer = customerRepository.findByUserId(userId);
        if (customer.isPresent()) {
            return ResponseEntity.ok(customer.get());
        }
        return ResponseEntity.badRequest().body("Customer not found for this User ID");
    }

    
    @PostMapping("/{customerId}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long customerId, @RequestParam("file") MultipartFile file) {
        Optional<Customer> customerOpt = customerRepository.findById(customerId);
        if (!customerOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Customer not found");
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload");
        }

        try {
            
            String uploadDir = System.getProperty("user.dir") + "/uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.write(filePath, file.getBytes());

           
            Customer customer = customerOpt.get();
            customer.setAvatarUrl("/uploads/" + fileName);
            customerRepository.save(customer);

            return ResponseEntity.ok(Map.of("message", "Avatar uploaded successfully!", "avatarUrl", customer.getAvatarUrl()));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to upload avatar");
        }
    }
}