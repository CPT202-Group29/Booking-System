package com.cpt202.booking_system.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonGetter;

@Data
@Entity
@Table(name = "specialist")
public class Specialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
}
