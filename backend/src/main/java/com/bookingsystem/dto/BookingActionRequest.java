package com.bookingsystem.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for admin/specialist actions (confirm, complete).
 */
public class BookingActionRequest {

    @NotNull(message = "User ID is required")
    @Positive
    private Long userId;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
