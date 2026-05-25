package com.cpt202.booking_system.dto;

import com.cpt202.booking_system.model.Booking;
import com.cpt202.booking_system.model.BookingStatus;
import com.cpt202.booking_system.model.TimeSlot;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Response DTO returned after booking operations.
 */
public class BookingResponse {

    private Long id;
    private Long customerId;
    private Long specialistId;
    private Long timeSlotId;
    private String date;
    private String time;
    private BookingStatus status;
    private String topic;
    private String notes;
    private BigDecimal chargeAmount;
    private BigDecimal refundAmount;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse fromEntity(Booking booking) {
        return fromEntity(booking, null);
    }

    public static BookingResponse fromEntity(Booking booking, TimeSlot slot) {
        BookingResponse resp = new BookingResponse();
        resp.id = booking.getId();
        resp.customerId = booking.getCustomerId();
        resp.specialistId = booking.getSpecialistId();
        resp.timeSlotId = booking.getTimeSlotId();
        resp.status = booking.getStatus();
        resp.topic = booking.getTopic();
        resp.notes = booking.getNotes();
        resp.chargeAmount = booking.getChargeAmount();
        resp.refundAmount = booking.getRefundAmount();
        resp.cancelReason = booking.getCancelReason();
        resp.createdAt = booking.getCreatedAt();
        resp.updatedAt = booking.getUpdatedAt();
        if (slot != null) {
            resp.date = slot.getStartTime().toLocalDate().toString();
            resp.time = slot.getStartTime().toLocalTime()
                    + " - " + slot.getEndTime().toLocalTime();
        }
        return resp;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public Long getSpecialistId() { return specialistId; }
    public Long getTimeSlotId() { return timeSlotId; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public BookingStatus getStatus() { return status; }
    public String getTopic() { return topic; }
    public String getNotes() { return notes; }
    public BigDecimal getChargeAmount() { return chargeAmount; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public String getCancelReason() { return cancelReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
