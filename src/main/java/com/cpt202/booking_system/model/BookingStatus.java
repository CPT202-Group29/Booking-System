package com.cpt202.booking_system.model;

/**
 * Represents the lifecycle states of a booking.
 *
 * Flow: PENDING -> CONFIRMED -> COMPLETED
 *       PENDING -> CANCELLED
 *       CONFIRMED -> CANCELLED (subject to 24h rule)
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED
}
