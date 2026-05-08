package com.booking.controller;

import com.booking.dto.*;
import com.booking.model.BookingStatus;
import com.booking.model.BookingStatusLog;
import com.booking.model.TimeSlot;
import com.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> requestBooking(
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.requestBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBooking(id));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> listBookings(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Long specialistId,
            @RequestParam(required = false) BookingStatus status) {
        if (customerId != null) {
            return ResponseEntity.ok(bookingService.getCustomerBookings(customerId));
        } else if (specialistId != null) {
            return ResponseEntity.ok(bookingService.getSpecialistBookings(specialistId));
        }
        return ResponseEntity.ok(bookingService.listAllBookings(status));
    }

    @PutMapping("/bookings/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/bookings/{id}/complete")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.completeBooking(id));
    }

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @Valid @RequestBody CancelRequest request) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, request));
    }

    @PostMapping("/bookings/{id}/admin-cancel")
    public ResponseEntity<BookingResponse> adminCancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) AdminCancelRequest request) {
        String reason = (request != null && request.getCancelReason() != null)
                ? request.getCancelReason() : "Cancelled by admin";
        return ResponseEntity.ok(bookingService.adminCancelBooking(id, reason));
    }

    @PostMapping("/bookings/{id}/reschedule")
    public ResponseEntity<BookingResponse> rescheduleBooking(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request) {
        return ResponseEntity.ok(bookingService.rescheduleBooking(id, request));
    }

    @GetMapping("/bookings/{id}/logs")
    public ResponseEntity<List<BookingStatusLog>> getBookingStatusLogs(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getStatusLogs(id));
    }

    @GetMapping("/slots")
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(
            @RequestParam Long specialistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(
                bookingService.getAvailableSlots(specialistId, from, to));
    }

    @GetMapping("/specialists/{id}/availability")
    public ResponseEntity<AvailabilityResponse> getAvailability(
            @PathVariable Long id,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime f = (from != null) ? from : LocalDateTime.now();
        LocalDateTime t = (to != null) ? to : LocalDateTime.now().plusDays(7);
        return ResponseEntity.ok(
                bookingService.getSpecialistAvailability(id, f, t));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "BE2-Booking",
                "timestamp", LocalDateTime.now().toString()));
    }
}
