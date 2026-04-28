package com.bookingsystem.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Frontend-friendly specialist availability response.
 * Groups time slots by date with human-readable time ranges.
 */
public class AvailabilityResponse {

    private Long specialistId;
    private int totalAvailableSlots;
    private String nextAvailableSlot;       // e.g. "2026-04-28T09:00"
    private List<DayGroup> byDay;           // Slots grouped by calendar date

    public static class DayGroup {
        private String date;                // e.g. "2026-04-28"
        private String dayOfWeek;           // e.g. "Monday"
        private List<SlotItem> slots;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

        public List<SlotItem> getSlots() { return slots; }
        public void setSlots(List<SlotItem> slots) { this.slots = slots; }
    }

    public static class SlotItem {
        private Long slotId;
        private String time;                // e.g. "09:00 - 10:00"

        public Long getSlotId() { return slotId; }
        public void setSlotId(Long slotId) { this.slotId = slotId; }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
    }

    // --- Getters and Setters ---

    public Long getSpecialistId() { return specialistId; }
    public void setSpecialistId(Long specialistId) { this.specialistId = specialistId; }

    public int getTotalAvailableSlots() { return totalAvailableSlots; }
    public void setTotalAvailableSlots(int totalAvailableSlots) { this.totalAvailableSlots = totalAvailableSlots; }

    public String getNextAvailableSlot() { return nextAvailableSlot; }
    public void setNextAvailableSlot(String nextAvailableSlot) { this.nextAvailableSlot = nextAvailableSlot; }

    public List<DayGroup> getByDay() { return byDay; }
    public void setByDay(List<DayGroup> byDay) { this.byDay = byDay; }
}
