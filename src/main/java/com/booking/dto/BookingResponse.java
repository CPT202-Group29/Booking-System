package com.booking.dto;

import com.booking.model.Booking;
import com.booking.model.BookingStatus;
import com.booking.model.TimeSlot;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Response DTO returned after booking operations.
 */
public class BookingResponse {

    private Long id;
    private Integer customerId;   // 改为 Integer，与 Booking.customerId 类型一致
    private Long specialistId;
    private Long timeSlotId;
    private String date;
    private String time;
    private BookingStatus status;
    private String topic;
    private String notes;
    private BigDecimal chargeAmount;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse fromEntity(Booking booking) {
        return fromEntity(booking, null);
    }

    public static BookingResponse fromEntity(Booking booking, TimeSlot slot) {
        BookingResponse resp = new BookingResponse();
        resp.id = booking.getId();
        resp.customerId = booking.getCustomerId();      // Booking.getCustomerId() 现在返回 Integer
        resp.specialistId = booking.getSpecialistId();
        resp.timeSlotId = booking.getTimeSlotId();
        resp.status = booking.getStatus();
        resp.topic = booking.getTopic();
        resp.notes = booking.getNotes();
        resp.chargeAmount = booking.getChargeAmount();
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
    public Integer getCustomerId() { return customerId; }   // 返回类型改为 Integer
    public Long getSpecialistId() { return specialistId; }
    public Long getTimeSlotId() { return timeSlotId; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public BookingStatus getStatus() { return status; }
    public String getTopic() { return topic; }
    public String getNotes() { return notes; }
    public BigDecimal getChargeAmount() { return chargeAmount; }
    public String getCancelReason() { return cancelReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    private BigDecimal refundAmount;

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
}
