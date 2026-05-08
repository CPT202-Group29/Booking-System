package com.booking.model;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED,
    EXPIRED      // 新增：24h 未确认自动过期
}
