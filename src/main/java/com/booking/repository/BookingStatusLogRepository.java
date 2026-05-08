package com.booking.repository;

import com.booking.model.BookingStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingStatusLogRepository extends JpaRepository<BookingStatusLog, Long> {
    List<BookingStatusLog> findByBookingIdOrderByChangedAtAsc(Long bookingId);
}
