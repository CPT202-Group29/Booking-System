package com.bookingsystem.dto;

import com.bookingsystem.model.Booking;
import com.bookingsystem.model.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO returned after booking operations.
 */
public class BookingResponse {

    private Long id;
    private Long customerId;
    private Long specialistId;
    private Long timeSlotId;
    private BookingStatus status;
    private String topic;
    private String notes;
    private BigDecimal chargeAmount;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse fromEntity(Booking booking) {
        BookingResponse resp = new BookingResponse();
        resp.id = booking.getId();
        resp.customerId = booking.getCustomerId();
        resp.specialistId = booking.getSpecialistId();
        resp.timeSlotId = booking.getTimeSlotId();
        resp.status = booking.getStatus();
        resp.topic = booking.getTopic();
        resp.notes = booking.getNotes();
        resp.chargeAmount = booking.getChargeAmount();
        resp.cancelReason = booking.getCancelReason();
        resp.createdAt = booking.getCreatedAt();
        resp.updatedAt = booking.getUpdatedAt();
        return resp;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public Long getSpecialistId() { return specialistId; }
    public Long getTimeSlotId() { return timeSlotId; }
    public BookingStatus getStatus() { return status; }
    public String getTopic() { return topic; }
    public String getNotes() { return notes; }
    public BigDecimal getChargeAmount() { return chargeAmount; }
    public String getCancelReason() { return cancelReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
