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

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    // lock the slot when booking to prevent two people booking same slot
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    public Optional<TimeSlot> findByIdWithLock(@Param("id") Long id);

    // get ALL slots for a specialist - used in specialist dashboard
    public List<TimeSlot> findBySpecialistId(Long specialistId);

    // get only available slots for a specialist
    public List<TimeSlot> findBySpecialistIdAndIsAvailableTrue(Long specialistId);

    // get available slots within a date range - used in booking page
    @Query("SELECT t FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.isAvailable = true AND t.startTime >= :from " +
           "AND t.endTime <= :to ORDER BY t.startTime ASC")
    public List<TimeSlot> findAvailableSlotsBySpecialistAndDateRange(
            @Param("specialistId") Long specialistId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    public boolean existsByIdAndIsAvailableTrue(Long id);

    public List<TimeSlot> findByIdIn(List<Long> ids);

    // check if a new slot overlaps with existing slots
    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.isAvailable = true " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    public boolean existsOverlappingSlot(@Param("specialistId") Long specialistId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.specialistId = :specialistId " +
           "AND t.id <> :excludeId " +
           "AND t.isAvailable = true " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    public boolean existsOverlappingSlotExcludingId(@Param("specialistId") Long specialistId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime,
                                                     @Param("excludeId") Long excludeId);

    @Query("SELECT DISTINCT t.specialistId FROM TimeSlot t " +
           "WHERE t.isAvailable = true " +
           "AND t.startTime <= :customerEnd " +
           "AND t.endTime >= :customerStart")
    public List<Long> findSpecialistIdsWithAvailableSlotInRange(
            @Param("customerStart") LocalDateTime customerStart,
            @Param("customerEnd") LocalDateTime customerEnd);
}
