package com.cpt202.booking_system.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonGetter;

@Entity
@Table(name = "specialists")
public class Specialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Expertise is required")
    @Size(max = 100, message = "Expertise must be at most 100 characters")
    private String expertise;

    @NotBlank(message = "Level is required")
    private String level;

    @NotNull(message = "Fee is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Fee must be >= 0")
    private BigDecimal fee;

    @NotNull(message = "Status is required")
    private Integer status;  // 1=Available, 0=Unavailable

    @NotBlank(message = "Contact is required")
    @Email(message = "Contact must be a valid email address")
    private String contact;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "approval_status")
    private String approvalStatus = "PENDING";

    @Column(name = "avatar_url", columnDefinition = "LONGTEXT")
    private String avatarUrl;

    public Specialist() {
    }

    @JsonGetter("statusText")
    public String getStatusText() {
        if (this.status == null) return "Unknown";
        return this.status == 1 ? "Available" : "Unavailable";
    }

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

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
