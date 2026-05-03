package com.cpt202.booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonGetter;

@Data
@Entity
@Table(name = "specialist")
public class Specialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String expertise;
    private String level;
    private BigDecimal fee;
    private Integer status;
    private String contact;
    private String description;

    @JsonGetter("statusText")
    public String getStatusText() {
        if (this.status == null) return "Unknown";
        return this.status == 1 ? "Available" : "Unavailable";
    }
}