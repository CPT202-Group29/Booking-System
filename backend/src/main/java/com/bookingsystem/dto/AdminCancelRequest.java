package com.bookingsystem.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for admin cancelling any booking.
 * Admin cancel skips ownership and 24-hour checks.
 */
public class AdminCancelRequest {

    @NotBlank(message = "Cancel reason is required")
    private String cancelReason;

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}
