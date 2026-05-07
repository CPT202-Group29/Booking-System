package com.booking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonGetter;

@Entity
@Table(name = "specialists")
public class Specialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Expertise is required")
    private String expertise;

    @NotBlank(message = "Level is required")
    private String level;

    @NotNull(message = "Fee is required")
    @Positive(message = "Fee must be positive")
    private BigDecimal fee;

    @NotNull(message = "Status is required")
    private Integer status;  // 1=Available, 0=Unavailable

    private String contact;
    private String description;

    @JsonGetter("statusText")
    public String getStatusText() {
        if (this.status == null) return "Unknown";
        return this.status == 1 ? "Available" : "Unavailable";
    }

    // --- Getters and Setters (手动添加) ---

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
