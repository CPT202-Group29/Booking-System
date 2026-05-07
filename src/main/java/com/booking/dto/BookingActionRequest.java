package com.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for admin/specialist actions (confirm, complete).
 */
public class BookingActionRequest {

    @NotNull(message = "User ID is required")
    @Positive
    private Integer userId;   // 改为 Integer，与 User.userId 类型一致

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}
