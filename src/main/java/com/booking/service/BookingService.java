package com.booking.service;

import com.booking.dto.*;
import com.booking.exception.BookingException;
import com.booking.model.Booking;
import com.booking.model.BookingStatus;
import com.booking.model.BookingStatusLog;
import com.booking.model.TimeSlot;
import com.booking.repository.BookingRepository;
import com.booking.repository.BookingStatusLogRepository;
import com.booking.repository.TimeSlotRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private static final int CANCEL_HOURS_THRESHOLD = 24;

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ChargeCalculationService chargeService;
    private final BookingStatusLogRepository logRepository;

    public BookingService(BookingRepository bookingRepository,
                          TimeSlotRepository timeSlotRepository,
                          ChargeCalculationService chargeService,
                          BookingStatusLogRepository logRepository) {
        this.bookingRepository = bookingRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.chargeService = chargeService;
        this.logRepository = logRepository;
    }

    /**
     * 记录状态变更日志
     */
    private void logStatusChange(Long bookingId, String previousStatus, String newStatus,
                                 String changedBy, String reason) {
        BookingStatusLog log = new BookingStatusLog(bookingId, previousStatus, newStatus,
                changedBy, reason);
        logRepository.save(log);
    }

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
        logStatusChange(saved.getId(), null, BookingStatus.PENDING.name(), "CUSTOMER", "Booking created");
        return toResponse(saved);
    }

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

    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        return toResponse(booking);
    }

    /** List bookings for a customer. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getCustomerBookings(Integer customerId) {
        List<Booking> bookings = bookingRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId);
        return toResponseList(bookings);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getSpecialistBookings(Long specialistId) {
        List<Booking> bookings = bookingRepository
                .findBySpecialistIdOrderByCreatedAtDesc(specialistId);
        return toResponseList(bookings);
    }

    public BookingResponse confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        String previousStatus = booking.getStatus().name();
        if (!booking.canConfirm()) {
            throw new BookingException(
                    "Cannot confirm booking " + bookingId
                    + ". Current status: " + booking.getStatus(), 400);
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        BookingResponse response = toResponse(bookingRepository.save(booking));
        logStatusChange(bookingId, previousStatus, BookingStatus.CONFIRMED.name(), "ADMIN", "Booking confirmed");
        return response;
    }

    public BookingResponse completeBooking(Long bookingId) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));
        String previousStatus = booking.getStatus().name();
        if (!booking.canComplete()) {
            throw new BookingException(
                    "Cannot complete booking " + bookingId
                    + ". Current status: " + booking.getStatus(), 400);
        }
        booking.setStatus(BookingStatus.COMPLETED);
        BookingResponse response = toResponse(bookingRepository.save(booking));
        logStatusChange(bookingId, previousStatus, BookingStatus.COMPLETED.name(), "SPECIALIST", "Booking completed");
        return response;
    }

    public BookingResponse cancelBooking(Long bookingId, CancelRequest request) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));

        if (!booking.getCustomerId().equals(request.getCustomerId())) {
            throw new BookingException(
                    "Customer " + request.getCustomerId()
                    + " is not the owner of booking " + bookingId, 403);
        }
        String previousStatus = booking.getStatus().name();
        if (!booking.canCancel()) {
            throw new BookingException(
                    "Booking " + bookingId + " cannot be cancelled in "
                    + booking.getStatus() + " state", 400);
        }

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

        slot.setIsAvailable(true);
        try {
            timeSlotRepository.save(slot);
        } catch (OptimisticLockingFailureException e) {
            throw new BookingException("Slot release failed due to concurrent update.", 409, e);
        }

        logStatusChange(bookingId, previousStatus, BookingStatus.CANCELLED.name(), "CUSTOMER", request.getCancelReason());
        return toResponse(saved);
    }

    public BookingResponse rescheduleBooking(Long bookingId, RescheduleRequest request) {
        Booking existing = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));

        if (!existing.getCustomerId().equals(request.getCustomerId())) {
            throw new BookingException(
                    "Customer " + request.getCustomerId()
                    + " is not the owner of booking " + bookingId, 403);
        }
        String previousStatus = existing.getStatus().name();
        if (!existing.canReschedule()) {
            throw new BookingException(
                    "Booking " + bookingId + " cannot be rescheduled in "
                    + existing.getStatus() + " state", 400);
        }

        TimeSlot oldSlot = timeSlotRepository.findById(existing.getTimeSlotId())
                .orElseThrow(() -> new BookingException("Original time slot not found", 404));
        long hoursUntil = LocalDateTime.now().until(oldSlot.getStartTime(), ChronoUnit.HOURS);
        if (hoursUntil < CANCEL_HOURS_THRESHOLD) {
            throw new BookingException(
                    "Cannot reschedule within " + CANCEL_HOURS_THRESHOLD
                    + " hours. " + hoursUntil + "h remaining.", 400);
        }

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

        existing.setStatus(BookingStatus.CANCELLED);
        existing.setCancelReason("Rescheduled to time slot " + request.getNewTimeSlotId());
        bookingRepository.save(existing);

        oldSlot.setIsAvailable(true);
        newSlot.setIsAvailable(false);
        timeSlotRepository.save(oldSlot);
        timeSlotRepository.save(newSlot);

        Booking newBooking = new Booking();
        newBooking.setCustomerId(existing.getCustomerId());
        newBooking.setSpecialistId(existing.getSpecialistId());
        newBooking.setTimeSlotId(request.getNewTimeSlotId());
        newBooking.setTopic(existing.getTopic());
        newBooking.setNotes(existing.getNotes());
        newBooking.setStatus(existing.getStatus() == BookingStatus.CONFIRMED
                ? BookingStatus.CONFIRMED : BookingStatus.PENDING);
        newBooking.setChargeAmount(chargeService.calculateCharge(existing.getSpecialistId()));

        BookingResponse response = toResponse(bookingRepository.save(newBooking));
        logStatusChange(bookingId, previousStatus, BookingStatus.CANCELLED.name(), "CUSTOMER",
                "Rescheduled -> new booking " + newBooking.getId());
        return response;
    }

    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlots(
            Long specialistId, LocalDateTime from, LocalDateTime to) {
        return timeSlotRepository.findAvailableSlotsBySpecialistAndDateRange(
                specialistId, from, to);
    }

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

    @Transactional(readOnly = true)
    public List<BookingResponse> listAllBookings(BookingStatus status) {
        List<Booking> bookings = (status != null)
                ? bookingRepository.findByStatus(status)
                : bookingRepository.findAllByOrderByCreatedAtDesc();
        return toResponseList(bookings);
    }

    public BookingResponse adminCancelBooking(Long bookingId, String cancelReason) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> new BookingException(
                        "Booking not found: " + bookingId, 404));

        String previousStatus = booking.getStatus().name();
        if (!booking.canCancel()) {
            throw new BookingException(
                    "Cannot cancel booking " + bookingId
                    + " in " + booking.getStatus() + " state", 400);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(cancelReason);
        Booking saved = bookingRepository.save(booking);

        TimeSlot slot = timeSlotRepository.findById(booking.getTimeSlotId())
                .orElseThrow(() -> new BookingException("Time slot not found", 404));
        slot.setIsAvailable(true);
        try {
            timeSlotRepository.save(slot);
        } catch (OptimisticLockingFailureException e) {
            throw new BookingException("Slot release failed due to concurrent update.", 409, e);
        }

        logStatusChange(bookingId, previousStatus, BookingStatus.CANCELLED.name(), "ADMIN", cancelReason);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingStatusLog> getStatusLogs(Long bookingId) {
        return logRepository.findByBookingIdOrderByChangedAtAsc(bookingId);
    }

    private BookingResponse toResponse(Booking booking) {
        TimeSlot slot = timeSlotRepository.findById(booking.getTimeSlotId()).orElse(null);
        return BookingResponse.fromEntity(booking, slot);
    }

    private List<BookingResponse> toResponseList(List<Booking> bookings) {
        if (bookings.isEmpty()) return List.of();
        List<Long> slotIds = bookings.stream()
                .map(Booking::getTimeSlotId).distinct().collect(Collectors.toList());
        Map<Long, TimeSlot> slotMap = timeSlotRepository.findByIdIn(slotIds).stream()
                .collect(Collectors.toMap(TimeSlot::getId, s -> s));
        return bookings.stream()
                .map(b -> BookingResponse.fromEntity(b, slotMap.get(b.getTimeSlotId())))
                .collect(Collectors.toList());
    }
}
