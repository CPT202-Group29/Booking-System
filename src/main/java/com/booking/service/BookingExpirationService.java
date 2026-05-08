package com.booking.service;

import com.booking.model.Booking;
import com.booking.model.BookingStatus;
import com.booking.model.BookingStatusLog;
import com.booking.model.TimeSlot;
import com.booking.repository.BookingRepository;
import com.booking.repository.BookingStatusLogRepository;
import com.booking.repository.TimeSlotRepository;
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

    /** 每分钟扫描一次，自动过期超过24小时的 PENDING 预约 */
    @Scheduled(fixedRate = 60000) // 60,000 ms = 1 minute
    @Transactional
    public void expirePendingBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Booking> expiredBookings = bookingRepository.findPendingBookingsOlderThan(cutoff);

        for (Booking booking : expiredBookings) {
            if (booking.canExpire()) {
                // 更新预约状态
                BookingStatus previousStatus = booking.getStatus();
                booking.setStatus(BookingStatus.EXPIRED);
                booking.setCancelReason("Automatically expired after 24 hours");
                bookingRepository.save(booking);

                // 释放对应的时间槽
                TimeSlot slot = timeSlotRepository.findById(booking.getTimeSlotId()).orElse(null);
                if (slot != null && !slot.getIsAvailable()) {
                    slot.setIsAvailable(true);
                    timeSlotRepository.save(slot);
                }

                // 记录状态变更日志
                BookingStatusLog log = new BookingStatusLog(
                        booking.getId(),
                        previousStatus.name(),
                        BookingStatus.EXPIRED.name(),
                        "SYSTEM",
                        "Auto-expired: no confirmation within 24 hours"
                );
                logRepository.save(log);

                System.out.println("EXPIRED booking #" + booking.getId() + " (was PENDING since " + booking.getCreatedAt() + ")");
            }
        }
    }
}
