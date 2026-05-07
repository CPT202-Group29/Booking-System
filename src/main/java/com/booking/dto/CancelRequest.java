package com.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for cancelling a booking.
 */
public class CancelRequest {

    @NotNull(message = "Customer ID is required")
    private Integer customerId;   // 改为 Integer，与 User.userId 和 Booking.customerId 类型一致

    @NotBlank(message = "Cancel reason is required")
    private String cancelReason;

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}
