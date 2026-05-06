package com.cpt202.booking_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for creating a new booking.
 */
public class BookingRequest {

    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be positive")
    private Long customerId;

    @NotNull(message = "Specialist ID is required")
    @Positive(message = "Specialist ID must be positive")
    private Long specialistId;

    @NotNull(message = "Time slot ID is required")
    @Positive(message = "Time slot ID must be positive")
    private Long timeSlotId;

    @NotBlank(message = "Topic is required")
    private String topic;

    private String notes;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getSpecialistId() { return specialistId; }
    public void setSpecialistId(Long specialistId) { this.specialistId = specialistId; }

    public Long getTimeSlotId() { return timeSlotId; }
    public void setTimeSlotId(Long timeSlotId) { this.timeSlotId = timeSlotId; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
