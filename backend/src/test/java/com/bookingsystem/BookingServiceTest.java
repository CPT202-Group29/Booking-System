package com.bookingsystem;

import com.bookingsystem.dto.*;
import com.bookingsystem.exception.BookingException;
import com.bookingsystem.model.Booking;
import com.bookingsystem.model.BookingStatus;
import com.bookingsystem.model.TimeSlot;
import com.bookingsystem.repository.BookingRepository;
import com.bookingsystem.repository.TimeSlotRepository;
import com.bookingsystem.service.BookingService;
import com.bookingsystem.service.ChargeCalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class BookingServiceTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private ChargeCalculationService chargeService;

    private Long slot1Id, slot2Id;
    private final Long customerId = 100L;
    private final Long specialistId = 200L;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        timeSlotRepository.deleteAll();

        TimeSlot s1 = new TimeSlot();
        s1.setSpecialistId(specialistId);
        s1.setStartTime(LocalDateTime.now().plusDays(2));
        s1.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        s1.setIsAvailable(true);
        slot1Id = timeSlotRepository.save(s1).getId();

        TimeSlot s2 = new TimeSlot();
        s2.setSpecialistId(specialistId);
        s2.setStartTime(LocalDateTime.now().plusDays(3));
        s2.setEndTime(LocalDateTime.now().plusDays(3).plusHours(1));
        s2.setIsAvailable(true);
        slot2Id = timeSlotRepository.save(s2).getId();
    }

    @Test
    @DisplayName("Create booking successfully")
    void testCreateBooking() {
        BookingRequest req = new BookingRequest();
        req.setCustomerId(customerId);
        req.setSpecialistId(specialistId);
        req.setTimeSlotId(slot1Id);
        req.setTopic("Database design consultation");

        BookingResponse resp = bookingService.requestBooking(req);

        assertNotNull(resp.getId());
        assertEquals(customerId, resp.getCustomerId());
        assertEquals(BookingStatus.PENDING, resp.getStatus());
        assertEquals(new BigDecimal("50.00"), resp.getChargeAmount());

        assertFalse(timeSlotRepository.findById(slot1Id).orElseThrow().getIsAvailable());
    }

    @Test
    @DisplayName("Reject double booking of the same time slot")
    void testDoubleBookingPrevention() {
        BookingRequest req = new BookingRequest();
        req.setCustomerId(customerId);
        req.setSpecialistId(specialistId);
        req.setTimeSlotId(slot1Id);
        req.setTopic("First booking");
        bookingService.requestBooking(req);

        BookingRequest dup = new BookingRequest();
        dup.setCustomerId(101L);
        dup.setSpecialistId(specialistId);
        dup.setTimeSlotId(slot1Id);
        dup.setTopic("Duplicate");

        assertThrows(BookingException.class, () -> bookingService.requestBooking(dup));
    }

    @Test
    @DisplayName("Confirm pending booking")
    void testConfirmBooking() {
        Booking booking = createBooking();
        BookingActionRequest req = new BookingActionRequest();
        req.setUserId(1L);

        assertEquals(BookingStatus.CONFIRMED,
                bookingService.confirmBooking(booking.getId(), req).getStatus());
    }

    @Test
    @DisplayName("Complete confirmed booking")
    void testCompleteBooking() {
        Booking booking = createBooking();
        BookingActionRequest req = new BookingActionRequest();
        req.setUserId(1L);
        bookingService.confirmBooking(booking.getId(), req);

        assertEquals(BookingStatus.COMPLETED,
                bookingService.completeBooking(booking.getId(), req).getStatus());
    }

    @Test
    @DisplayName("Cancel booking and release slot")
    void testCancelBooking() {
        Booking booking = createBooking();
        CancelRequest req = new CancelRequest();
        req.setCustomerId(customerId);
        req.setCancelReason("Schedule conflict");

        BookingResponse resp = bookingService.cancelBooking(booking.getId(), req);
        assertEquals(BookingStatus.CANCELLED, resp.getStatus());
        assertEquals("Schedule conflict", resp.getCancelReason());
        assertTrue(timeSlotRepository.findById(slot1Id).orElseThrow().getIsAvailable());
    }

    @Test
    @DisplayName("Reject cancellation by non-owner")
    void testCancelByNonOwner() {
        Booking booking = createBooking();
        CancelRequest req = new CancelRequest();
        req.setCustomerId(999L);
        req.setCancelReason("No reason");
        assertThrows(BookingException.class,
                () -> bookingService.cancelBooking(booking.getId(), req));
    }

    @Test
    @DisplayName("Reschedule to a new time slot")
    void testRescheduleBooking() {
        Booking booking = createBooking();
        RescheduleRequest req = new RescheduleRequest();
        req.setCustomerId(customerId);
        req.setNewTimeSlotId(slot2Id);

        BookingResponse resp = bookingService.rescheduleBooking(booking.getId(), req);
        assertNotNull(resp.getId());
        assertEquals(slot2Id, resp.getTimeSlotId());

        Booking oldBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, oldBooking.getStatus());
    }

    @Test
    @DisplayName("List customer bookings")
    void testCustomerBookings() {
        createBooking();
        List<BookingResponse> list = bookingService.getCustomerBookings(customerId);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Calculate correct charge")
    void testChargeCalculation() {
        assertEquals(new BigDecimal("50.00"), chargeService.calculateCharge(specialistId));
    }

    @Test
    @DisplayName("Full refund for early cancellation (48h)")
    void testFullRefund() {
        assertEquals(new BigDecimal("50.00"), chargeService.calculateRefund(48));
    }

    @Test
    @DisplayName("No refund for last-minute cancellation (1h)")
    void testNoRefund() {
        assertEquals(BigDecimal.ZERO, chargeService.calculateRefund(1));
    }

    private Booking createBooking() {
        BookingRequest req = new BookingRequest();
        req.setCustomerId(customerId);
        req.setSpecialistId(specialistId);
        req.setTimeSlotId(slot1Id);
        req.setTopic("Test consultation");
        return bookingRepository.findById(
                bookingService.requestBooking(req).getId()).orElseThrow();
    }
}
