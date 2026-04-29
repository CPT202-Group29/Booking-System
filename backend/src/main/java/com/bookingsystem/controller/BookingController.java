package com.bookingsystem.controller;

import com.bookingsystem.dto.*;
import com.bookingsystem.model.BookingStatus;
import com.bookingsystem.model.TimeSlot;
import com.bookingsystem.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for the booking workflow.
 * All endpoints are prefixed with /api/v1 for API versioning.
 */
@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /** POST /api/v1/bookings - Create a booking request (PENDING). */
    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> requestBooking(
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.requestBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** GET /api/v1/bookings/{id} - Get booking details. */
    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBooking(id));
    }

    /**
     * GET /api/v1/bookings — list all bookings
     * GET /api/v1/bookings?customerId={id}
     * GET /api/v1/bookings?specialistId={id}
     * GET /api/v1/bookings?status=PENDING
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> listBookings(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long specialistId,
            @RequestParam(required = false) BookingStatus status) {
        if (customerId != null) {
            return ResponseEntity.ok(bookingService.getCustomerBookings(customerId));
        } else if (specialistId != null) {
            return ResponseEntity.ok(bookingService.getSpecialistBookings(specialistId));
        }
        return ResponseEntity.ok(bookingService.listAllBookings(status));
    }

    /** PUT /api/v1/bookings/{id}/confirm - Admin confirms a PENDING booking. */
    @PutMapping("/bookings/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingActionRequest request) {
        return ResponseEntity.ok(bookingService.confirmBooking(id, request));
    }

    /** PUT /api/v1/bookings/{id}/complete - Specialist marks as COMPLETED. */
    @PutMapping("/bookings/{id}/complete")
    public ResponseEntity<BookingResponse> completeBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingActionRequest request) {
        return ResponseEntity.ok(bookingService.completeBooking(id, request));
    }

    /** POST /api/v1/bookings/{id}/cancel - Customer cancels (24h rule). */
    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @Valid @RequestBody CancelRequest request) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, request));
    }

    /** POST /api/v1/bookings/{id}/admin-cancel - Admin cancels (no 24h/ownership check). */
    @PostMapping("/bookings/{id}/admin-cancel")
    public ResponseEntity<BookingResponse> adminCancelBooking(
            @PathVariable Long id,
            @Valid @RequestBody AdminCancelRequest request) {
        return ResponseEntity.ok(
                bookingService.adminCancelBooking(id, request.getCancelReason()));
    }

    /** POST /api/v1/bookings/{id}/reschedule - Customer reschedules. */
    @PostMapping("/bookings/{id}/reschedule")
    public ResponseEntity<BookingResponse> rescheduleBooking(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request) {
        return ResponseEntity.ok(bookingService.rescheduleBooking(id, request));
    }

    /** GET /api/v1/slots?specialistId=X&from=...&to=... */
    @GetMapping("/slots")
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(
            @RequestParam Long specialistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(
                bookingService.getAvailableSlots(specialistId, from, to));
    }

    /**
     * GET /api/v1/specialists/{id}/availability
     * Returns frontend-friendly availability grouped by date.
     * Default: next 7 days if from/to not specified.
     */
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

    /** GET /api/v1/health - Health check. */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "BE2-Booking",
                "timestamp", LocalDateTime.now().toString()));
    }
}
