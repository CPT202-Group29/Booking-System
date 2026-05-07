package com.booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "expertises")
public class Expertise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String expertiseName;
    private String description;
    private String status;      // "Active", "Inactive"
    private Integer usedBy;     // count of specialists using this expertise

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getExpertiseName() { return expertiseName; }
    public void setExpertiseName(String expertiseName) { this.expertiseName = expertiseName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getUsedBy() { return usedBy; }
    public void setUsedBy(Integer usedBy) { this.usedBy = usedBy; }
}
