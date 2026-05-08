package com.booking.repository;

import com.booking.model.TimeSlot;
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
 * Repository for time slot data access.
 */
@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    /** Find time slot with pessimistic lock for concurrency-safe booking. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdWithLock(@Param("id") Long id);

    List<TimeSlot> findBySpecialistIdAndIsAvailableTrue(Long specialistId);

    @Query("SELECT t FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.isAvailable = true AND t.startTime >= :from " +
           "AND t.endTime <= :to ORDER BY t.startTime ASC")
    List<TimeSlot> findAvailableSlotsBySpecialistAndDateRange(
            @Param("specialistId") Long specialistId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    boolean existsByIdAndIsAvailableTrue(Long id);

    List<TimeSlot> findByIdIn(List<Long> ids);

    /** Check if a slot exists that overlaps with the given time range for a specialist. */
    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.isAvailable = true " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    boolean existsOverlappingSlot(@Param("specialistId") Long specialistId,
                                   @Param("startTime") LocalDateTime startTime,
                                   @Param("endTime") LocalDateTime endTime);

    /** Check if a slot exists that overlaps with the given time range, excluding a specific slot ID (used for updates). */
    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.id <> :excludeId " +
           "AND t.isAvailable = true " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    boolean existsOverlappingSlotExcludingId(@Param("specialistId") Long specialistId,
                                              @Param("startTime") LocalDateTime startTime,
                                              @Param("endTime") LocalDateTime endTime,
                                              @Param("excludeId") Long excludeId);
}
