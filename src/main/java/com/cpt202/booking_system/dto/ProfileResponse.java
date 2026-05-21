package com.cpt202.booking_system.dto;

import com.cpt202.booking_system.entity.Customer;
import com.cpt202.booking_system.entity.User;

public class ProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private String role;
    private Long customerId;
    private String name;
    private String phone;
    private String gender;
    private Integer age;
    private String address;
    private String avatarUrl;

    public static ProfileResponse from(User user, Customer customer) {
        ProfileResponse resp = new ProfileResponse();
        resp.userId = user.getId();
        resp.username = user.getUsername();
        resp.email = user.getEmail();
        resp.role = user.getRole();
        if (customer != null) {
            resp.customerId = customer.getId();
            resp.name = customer.getName();
            resp.phone = customer.getPhone();
            resp.gender = customer.getGender();
            resp.age = customer.getAge();
            resp.address = customer.getAddress();
            resp.avatarUrl = customer.getAvatarUrl();
        }
        return resp;
    }

    // getters / setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
