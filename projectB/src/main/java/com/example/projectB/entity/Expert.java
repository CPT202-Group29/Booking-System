package com.example.projectB.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "experts")
public class Expert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String expertise; 

    @Column(nullable = false)
    private String level;     

    @Column(nullable = false)
    private Double fee;      

    @Column(nullable = false)
    private String status;    

    
    private String email;
    private String phone;
    private String description;

    public Expert() {
    }

    
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }
    
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    
    public Double getFee() { return fee; }
    public void setFee(Double fee) { this.fee = fee; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    
    
}
