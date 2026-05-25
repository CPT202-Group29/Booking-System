package com.cpt202.booking_system.controller;

import com.cpt202.booking_system.dto.BookingResponse;
import com.cpt202.booking_system.entity.Specialist;
import com.cpt202.booking_system.model.TimeSlot;
import com.cpt202.booking_system.repository.SpecialistRepository;
import com.cpt202.booking_system.repository.TimeSlotRepository;
import com.cpt202.booking_system.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
public class SpecialistDashboardController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SpecialistRepository specialistRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    // ===== Booking Management =====

    @GetMapping("/api/specialist/{specialistId}/bookings")
    public List<BookingResponse> getMyBookings(@PathVariable Long specialistId) {
        return bookingService.getSpecialistBookings(specialistId);
    }

    @PutMapping("/api/specialist/bookings/{bookingId}/confirm")
    public BookingResponse confirmBooking(@PathVariable Long bookingId) {
        return bookingService.confirmBooking(bookingId);
    }

    @PutMapping("/api/specialist/bookings/{bookingId}/complete")
    public BookingResponse completeBooking(@PathVariable Long bookingId) {
        return bookingService.completeBooking(bookingId);
    }

    @PostMapping("/api/specialist/bookings/{bookingId}/cancel")
    public BookingResponse cancelBooking(@PathVariable Long bookingId, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("cancelReason", "Cancelled by specialist");
        return bookingService.adminCancelBooking(bookingId, reason);
    }

    // ===== Time Slot Management =====

    @GetMapping("/api/specialist/{specialistId}/slots")
    public List<TimeSlot> getMySlots(@PathVariable Long specialistId) {
        return timeSlotRepository.findBySpecialistId(specialistId);
    }

    @PostMapping("/api/specialist/{specialistId}/slots")
    public TimeSlot addSlot(@PathVariable Long specialistId, @RequestBody TimeSlot slot) {
        slot.setSpecialistId(specialistId);
        slot.setIsAvailable(true);
        return timeSlotRepository.save(slot);
    }

    @PutMapping("/api/specialist/slots/{slotId}")
    public TimeSlot editSlot(@PathVariable Long slotId, @RequestBody TimeSlot updates) {
        TimeSlot slot = timeSlotRepository.findById(slotId).orElseThrow();
        if (updates.getStartTime() != null) slot.setStartTime(updates.getStartTime());
        if (updates.getEndTime() != null) slot.setEndTime(updates.getEndTime());
        return timeSlotRepository.save(slot);
    }

    @DeleteMapping("/api/specialist/slots/{slotId}")
    public Map<String, String> deleteSlot(@PathVariable Long slotId) {
        timeSlotRepository.deleteById(slotId);
        return Map.of("message", "Slot deleted successfully");
    }

    // ===== Profile Management =====

    @GetMapping("/api/specialist/{specialistId}/profile")
    public Object getProfile(@PathVariable Integer specialistId) {
        return specialistRepository.findById(specialistId)
            .map(s -> (Object) s)
            .orElseGet(() -> Map.of("error", "Specialist not found: " + specialistId));
    }

    @PutMapping("/api/specialist/{specialistId}/profile")
    public Specialist updateProfile(@PathVariable Integer specialistId, @RequestBody Map<String, String> body) {
        Specialist specialist = specialistRepository.findById(specialistId).orElseThrow();
        if (body.containsKey("name")) specialist.setName(body.get("name"));
        if (body.containsKey("contact")) specialist.setContact(body.get("contact"));
        if (body.containsKey("description")) specialist.setDescription(body.get("description"));
        return specialistRepository.save(specialist);
    }
}
