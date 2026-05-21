package com.booking.controller;

import com.booking.dto.BookingResponse;
import com.booking.entity.Specialist;
import com.booking.model.TimeSlot;
import com.booking.repository.SpecialistRepository;
import com.booking.repository.TimeSlotRepository;
import com.booking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

// This controller handles all specialist dashboard features
// Specialists can view their bookings, manage time slots, and edit their profile
@RestController
public class SpecialistDashboardController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SpecialistRepository specialistRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    // ===== Booking Management =====

    // Get all bookings for this specialist (their schedule)
    @GetMapping("/api/specialist/{specialistId}/bookings")
    public List<BookingResponse> getMyBookings(@PathVariable Long specialistId) {
        return bookingService.getSpecialistBookings(specialistId);
    }

    // Specialist confirms a booking
    @PutMapping("/api/specialist/bookings/{bookingId}/confirm")
    public BookingResponse confirmBooking(@PathVariable Long bookingId) {
        return bookingService.confirmBooking(bookingId);
    }

    // Specialist marks a booking as completed after the session
    @PutMapping("/api/specialist/bookings/{bookingId}/complete")
    public BookingResponse completeBooking(@PathVariable Long bookingId) {
        return bookingService.completeBooking(bookingId);
    }

    // Specialist cancels a booking
    @PostMapping("/api/specialist/bookings/{bookingId}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("cancelReason", "Cancelled by specialist");
        return bookingService.adminCancelBooking(bookingId, reason);
    }

    // ===== Time Slot Management =====

    // Get all time slots for this specialist
    @GetMapping("/api/specialist/{specialistId}/slots")
    public List<TimeSlot> getMySlots(@PathVariable Long specialistId) {
        return timeSlotRepository.findBySpecialistId(specialistId);
    }

    // Add a new time slot
    @PostMapping("/api/specialist/{specialistId}/slots")
    public TimeSlot addSlot(
            @PathVariable Long specialistId,
            @RequestBody TimeSlot slot) {
        slot.setSpecialistId(specialistId);
        slot.setIsAvailable(true);
        return timeSlotRepository.save(slot);
    }

    // Edit an existing time slot
    @PutMapping("/api/specialist/slots/{slotId}")
    public TimeSlot editSlot(
            @PathVariable Long slotId,
            @RequestBody TimeSlot updates) {
        TimeSlot slot = timeSlotRepository.findById(slotId).get();
        if (updates.getStartTime() != null) {
            slot.setStartTime(updates.getStartTime());
        }
        if (updates.getEndTime() != null) {
            slot.setEndTime(updates.getEndTime());
        }
        return timeSlotRepository.save(slot);
    }

    // Delete a time slot
    @DeleteMapping("/api/specialist/slots/{slotId}")
    public Map<String, String> deleteSlot(@PathVariable Long slotId) {
        timeSlotRepository.deleteById(slotId);
        return Map.of("message", "Slot deleted successfully");
    }

    // ===== Profile Management =====

    // Get specialist profile information
    @GetMapping("/api/specialist/{specialistId}/profile")
    public Specialist getProfile(@PathVariable Integer specialistId) {
        return specialistRepository.findById(specialistId).get();
    }

    // Update specialist profile (name, contact, description)
    @PutMapping("/api/specialist/{specialistId}/profile")
    public Specialist updateProfile(
            @PathVariable Integer specialistId,
            @RequestBody Map<String, String> body) {

        Specialist specialist = specialistRepository.findById(specialistId).get();

        if (body.containsKey("name")) {
            specialist.setName(body.get("name"));
        }
        if (body.containsKey("contact")) {
            specialist.setContact(body.get("contact"));
        }
        if (body.containsKey("description")) {
            specialist.setDescription(body.get("description"));
        }

        return specialistRepository.save(specialist);
    }
}
