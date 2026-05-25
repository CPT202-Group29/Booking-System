package com.cpt202.booking_system.service;

import com.cpt202.booking_system.model.Booking;
import com.cpt202.booking_system.model.BookingStatus;
import com.cpt202.booking_system.model.BookingStatusLog;
import com.cpt202.booking_system.model.TimeSlot;
import com.cpt202.booking_system.repository.BookingRepository;
import com.cpt202.booking_system.repository.BookingStatusLogRepository;
import com.cpt202.booking_system.repository.TimeSlotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingExpirationService {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final BookingStatusLogRepository logRepository;

    public BookingExpirationService(BookingRepository bookingRepository,
                                    TimeSlotRepository timeSlotRepository,
                                    BookingStatusLogRepository logRepository) {
        this.bookingRepository = bookingRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.logRepository = logRepository;
    }

    /** Run every 60 seconds: auto-expire PENDING bookings older than 24 hours */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Booking> expiredBookings = bookingRepository.findPendingBookingsOlderThan(cutoff);

        for (Booking booking : expiredBookings) {
            if (booking.canExpire()) {
                // Update booking status
                BookingStatus previousStatus = booking.getStatus();
                booking.setStatus(BookingStatus.EXPIRED);
                booking.setCancelReason("Automatically expired after 24 hours");
                bookingRepository.save(booking);

                // Release time slot
                TimeSlot slot = timeSlotRepository.findById(booking.getTimeSlotId()).orElse(null);
                if (slot != null && !slot.getIsAvailable()) {
                    slot.setIsAvailable(true);
                    timeSlotRepository.save(slot);
                }

                // Record audit log
                BookingStatusLog log = new BookingStatusLog(
                        booking.getId(),
                        previousStatus.name(),
                        BookingStatus.EXPIRED.name(),
                        "SYSTEM",
                        "Auto-expired: no confirmation within 24 hours"
                );
                logRepository.save(log);

                System.out.println("EXPIRED booking #" + booking.getId()
                        + " (was PENDING since " + booking.getCreatedAt() + ")");
            }
        }
    }
}
