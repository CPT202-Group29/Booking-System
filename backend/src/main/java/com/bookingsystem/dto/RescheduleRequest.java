package com.bookingsystem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for rescheduling a booking to a new time slot.
 */
public class RescheduleRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "New time slot ID is required")
    @Positive(message = "Time slot ID must be positive")
    private Long newTimeSlotId;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getNewTimeSlotId() { return newTimeSlotId; }
    public void setNewTimeSlotId(Long newTimeSlotId) { this.newTimeSlotId = newTimeSlotId; }
}
