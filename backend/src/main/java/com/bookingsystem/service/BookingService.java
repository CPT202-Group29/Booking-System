package com.bookingsystem.service;

import com.bookingsystem.dto.*;
import com.bookingsystem.exception.BookingException;
import com.bookingsystem.model.Booking;
import com.bookingsystem.model.BookingStatus;
import com.bookingsystem.model.TimeSlot;
import com.bookingsystem.repository.BookingRepository;
import com.bookingsystem.repository.TimeSlotRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Core booking service implementing the full booking workflow.
 *
 * Concurrency strategy:
 * - Pessimistic locking (SELECT FOR UPDATE) on time slot during booking creation
 * - Pessimistic locking on booking record during status transitions
 * - Optimistic locking (version column) on TimeSlot as fallback
 */
@Service
@Transactional
public class BookingService {

    private static final int CANCEL_HOURS_THRESHOLD = 24;

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ChargeCalculationService chargeService;

    public BookingService(BookingRepository bookingRepository,
                          TimeSlotRepository timeSlotRepository,
                          ChargeCalculationService chargeService) {
        this.bookingRepository = bookingRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.chargeService = chargeService;
    }

    /**
     * Create a new booking with double-booking prevention.
     * Locks the time slot pessimistically to prevent concurrent bookings.
     */
    public BookingResponse createBooking(BookingRequest request) {
        TimeSlot slot = timeSlotRepository.findByIdWithLock(request.getTimeSlotId())
                .orElseThrow(() -> new BookingException(
                        "Time slot not found: " + request.getTimeSlotId(), 404));

        if (!Boolean.TRUE.equals(slot.getIsAvailable())) {
            throw new BookingException(
                    "Time slot " + request.getTimeSlotId() + " is already booked", 409);
        }

        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.PENDING, BookingStatus.CONFIRMED);
        if (bookingRepository.existsActiveBookingForSlot(
                request.getTimeSlotId(), activeStatuses)) {
            throw new BookingException(
                    "Time slot " + request.getTimeSlotId()
                    + " already has an active booking", 409);
        }

        Booking booking = new Booking();
        booking.setCustomerId(request.getCustomerId());
        booking.setSpecialistId(request.getSpecialistId());
        booking.setTimeSlotId(request.getTimeSlotId());
        booking.setTopic(request.getTopic());
        booking.setNotes(request.getNotes());
        booking.setStatus(BookingStatus.PENDING);
        booking.setChargeAmount(chargeService.calculateCharge(request.getSpecialistId()));

        slot.setIsAvailable(false);
        try {
            timeSlotRepository.save(slot);
        } catch (OptimisticLockingFailureException e) {
            throw new BookingException(
                    "Booking failed due to concurrent update. Please try again.", 409, e);
        }

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    /** Customer creates a booking request (status: PENDING). */
    public BookingResponse requestBooking(BookingRequest request) {
        TimeSlot slot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new BookingException(
                        "Time slot not found: " + request.getTimeSlotId(), 404));
        if (!slot.getSpecialistId().equals(request.getSpecialistId())) {
            throw new BookingException(
                    "Time slot does not belong to specialist " + request.getSpecialistId(), 400);
        }
        return createBooking(request);
    }

    /** Get booking by ID. */
    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        return BookingResponse.fromEntity(booking);
    }

    /** List bookings for a customer. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(BookingResponse::fromEntity).collect(Collectors.toList());
    }

    /** List bookings for a specialist. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getSpecialistBookings(Long specialistId) {
        return bookingRepository.findBySpecialistIdOrderByCreatedAtDesc(specialistId)
                .stream().map(BookingResponse::fromEntity).collect(Collectors.toList());
    }

    /** Confirm a booking (admin action): PENDING -> CONFIRMED. */
    public BookingResponse confirmBooking(Long bookingId, BookingActionRequest request) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        if (!booking.canConfirm()) {
            throw new BookingException(
                    "Cannot confirm booking " + bookingId
                    + ". Current status: " + booking.getStatus(), 400);
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        return BookingResponse.fromEntity(bookingRepository.save(booking));
    }

    /** Complete a booking (specialist action): CONFIRMED -> COMPLETED. */
    public BookingResponse completeBooking(Long bookingId, BookingActionRequest request) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        if (!booking.canComplete()) {
            throw new BookingException(
                    "Cannot complete booking " + bookingId
                    + ". Current status: " + booking.getStatus(), 400);
        }
        booking.setStatus(BookingStatus.COMPLETED);
        return BookingResponse.fromEntity(bookingRepository.save(booking));
    }

    /**
     * Cancel a booking with 24-hour rule enforcement.
     * Only the booking owner can cancel. Releases the time slot after cancellation.
     */
    public BookingResponse cancelBooking(Long bookingId, CancelRequest request) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));

        if (!booking.getCustomerId().equals(request.getCustomerId())) {
            throw new BookingException(
                    "Customer " + request.getCustomerId()
                    + " is not the owner of booking " + bookingId, 403);
        }
        if (!booking.canCancel()) {
            throw new BookingException(
                    "Booking " + bookingId + " cannot be cancelled in "
                    + booking.getStatus() + " state", 400);
        }

        // 24-hour rule
        TimeSlot slot = timeSlotRepository.findById(booking.getTimeSlotId())
                .orElseThrow(() -> new BookingException("Time slot not found", 404));
        long hoursUntil = LocalDateTime.now().until(slot.getStartTime(), ChronoUnit.HOURS);
        if (hoursUntil < CANCEL_HOURS_THRESHOLD) {
            throw new BookingException(
                    "Cannot cancel within " + CANCEL_HOURS_THRESHOLD
                    + " hours of the appointment. " + hoursUntil + "h remaining.", 400);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(request.getCancelReason());
        Booking saved = bookingRepository.save(booking);

        // Release the time slot
        slot.setIsAvailable(true);
        try {
            timeSlotRepository.save(slot);
        } catch (OptimisticLockingFailureException e) {
            throw new BookingException("Slot release failed due to concurrent update.", 409, e);
        }

        return BookingResponse.fromEntity(saved);
    }

    /**
     * Reschedule a booking to a new time slot with full validation.
     * Cancels old booking, releases old slot, creates new booking at new slot.
     */
    public BookingResponse rescheduleBooking(Long bookingId, RescheduleRequest request) {
        Booking existing = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));

        // Ownership check
        if (!existing.getCustomerId().equals(request.getCustomerId())) {
            throw new BookingException(
                    "Customer " + request.getCustomerId()
                    + " is not the owner of booking " + bookingId, 403);
        }
        if (!existing.canReschedule()) {
            throw new BookingException(
                    "Booking " + bookingId + " cannot be rescheduled in "
                    + existing.getStatus() + " state", 400);
        }

        // 24-hour rule on original booking
        TimeSlot oldSlot = timeSlotRepository.findById(existing.getTimeSlotId())
                .orElseThrow(() -> new BookingException("Original time slot not found", 404));
        long hoursUntil = LocalDateTime.now().until(oldSlot.getStartTime(), ChronoUnit.HOURS);
        if (hoursUntil < CANCEL_HOURS_THRESHOLD) {
            throw new BookingException(
                    "Cannot reschedule within " + CANCEL_HOURS_THRESHOLD
                    + " hours. " + hoursUntil + "h remaining.", 400);
        }

        // Lock and validate new slot
        TimeSlot newSlot = timeSlotRepository.findByIdWithLock(request.getNewTimeSlotId())
                .orElseThrow(() -> new BookingException(
                        "New time slot not found: " + request.getNewTimeSlotId(), 404));
        if (!Boolean.TRUE.equals(newSlot.getIsAvailable())) {
            throw new BookingException(
                    "New time slot " + request.getNewTimeSlotId() + " is not available", 409);
        }
        if (!newSlot.getSpecialistId().equals(existing.getSpecialistId())) {
            throw new BookingException(
                    "New time slot does not belong to the same specialist", 400);
        }

        // Cancel old booking
        existing.setStatus(BookingStatus.CANCELLED);
        existing.setCancelReason("Rescheduled to time slot " + request.getNewTimeSlotId());
        bookingRepository.save(existing);

        // Swap slots
        oldSlot.setIsAvailable(true);
        newSlot.setIsAvailable(false);
        timeSlotRepository.save(oldSlot);
        timeSlotRepository.save(newSlot);

        // Create new booking
        Booking newBooking = new Booking();
        newBooking.setCustomerId(existing.getCustomerId());
        newBooking.setSpecialistId(existing.getSpecialistId());
        newBooking.setTimeSlotId(request.getNewTimeSlotId());
        newBooking.setTopic(existing.getTopic());
        newBooking.setNotes(existing.getNotes());
        newBooking.setStatus(existing.getStatus() == BookingStatus.CONFIRMED
                ? BookingStatus.CONFIRMED : BookingStatus.PENDING);
        newBooking.setChargeAmount(chargeService.calculateCharge(existing.getSpecialistId()));

        return BookingResponse.fromEntity(bookingRepository.save(newBooking));
    }

    /** Get available slots for a specialist within a date range. */
    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlots(
            Long specialistId, LocalDateTime from, LocalDateTime to) {
        return timeSlotRepository.findAvailableSlotsBySpecialistAndDateRange(
                specialistId, from, to);
    }

    /**
     * Get frontend-friendly availability for a specialist.
     * Groups available slots by date with human-readable time ranges.
     * Default: next 7 days.
     */
    @Transactional(readOnly = true)
    public AvailabilityResponse getSpecialistAvailability(
            Long specialistId, LocalDateTime from, LocalDateTime to) {
        List<TimeSlot> slots = timeSlotRepository
                .findAvailableSlotsBySpecialistAndDateRange(specialistId, from, to);

        AvailabilityResponse response = new AvailabilityResponse();
        response.setSpecialistId(specialistId);
        response.setTotalAvailableSlots(slots.size());

        if (!slots.isEmpty()) {
            response.setNextAvailableSlot(slots.get(0).getStartTime().toString());
        }

        // Group slots by date
        Map<String, List<TimeSlot>> grouped = slots.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getStartTime().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.toList()));

        List<AvailabilityResponse.DayGroup> dayGroups = new ArrayList<>();
        for (Map.Entry<String, List<TimeSlot>> entry : grouped.entrySet()) {
            AvailabilityResponse.DayGroup group = new AvailabilityResponse.DayGroup();
            group.setDate(entry.getKey());
            group.setDayOfWeek(entry.getValue().get(0).getStartTime()
                    .getDayOfWeek().toString());

            List<AvailabilityResponse.SlotItem> items = new ArrayList<>();
            for (TimeSlot s : entry.getValue()) {
                AvailabilityResponse.SlotItem item = new AvailabilityResponse.SlotItem();
                item.setSlotId(s.getId());
                item.setTime(s.getStartTime().toLocalTime()
                        + " - " + s.getEndTime().toLocalTime());
                items.add(item);
            }
            group.setSlots(items);
            dayGroups.add(group);
        }
        response.setByDay(dayGroups);

        return response;
    }
}
