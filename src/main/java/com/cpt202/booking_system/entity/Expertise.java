package com.cpt202.booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "expertise")
public class Expertise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 完美匹配 A2 的 JSON 字段名
    private String expertiseName;
    private String description;
    
    // 直接使用 String 接收 "Active" 或 "Inactive"
    private String status; 
    
    private Integer usedBy; 
}