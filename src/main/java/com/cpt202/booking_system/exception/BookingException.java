package com.cpt202.booking_system.exception;

/**
 * Base exception for booking-related business logic errors.
 * Carries an HTTP status code for API response mapping.
 */
public class BookingException extends RuntimeException {

    private final int statusCode;

    public BookingException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public BookingException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
