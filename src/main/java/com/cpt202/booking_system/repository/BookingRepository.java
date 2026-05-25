package com.cpt202.booking_system.repository;

import com.cpt202.booking_system.model.Booking;
import com.cpt202.booking_system.model.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for booking data access.
 * Uses pessimistic locking for concurrency-safe booking operations.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** Find booking with pessimistic lock for safe status transitions. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdWithLock(@Param("id") Long id);

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findBySpecialistIdOrderByCreatedAtDesc(Long specialistId);

    List<Booking> findByTimeSlotId(Long timeSlotId);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "WHERE b.timeSlotId = :slotId AND b.status IN :activeStatuses")
    boolean existsActiveBookingForSlot(
            @Param("slotId") Long slotId,
            @Param("activeStatuses") List<BookingStatus> activeStatuses);

    @Query("SELECT b FROM Booking b WHERE b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByStatus(@Param("status") BookingStatus status);

    List<Booking> findAllByOrderByCreatedAtDesc();

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.createdAt < :cutoff")
    List<Booking> findPendingBookingsOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
