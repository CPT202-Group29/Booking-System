package com.cpt202.booking_system.repository;

import com.cpt202.booking_system.model.BookingStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingStatusLogRepository extends JpaRepository<BookingStatusLog, Long> {
    List<BookingStatusLog> findByBookingIdOrderByChangedAtAsc(Long bookingId);
}
