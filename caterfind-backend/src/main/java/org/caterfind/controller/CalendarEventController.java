package org.caterfind.controller;

import org.caterfind.dto.CalendarEventDTO;
import org.caterfind.service.CalendarEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Calendar Event Controller
 * 
 * REST API endpoints for managing calendar events:
 * - POST /api/calendar/events?userId={id} - Create new event
 * - GET /api/calendar/events?userId={id} - Get all events for user
 * - GET /api/calendar/events?userId={id}&date={yyyy-MM-dd} - Get events for specific date
 * - GET /api/calendar/events?userId={id}&startDate={yyyy-MM-dd}&endDate={yyyy-MM-dd} - Get events in range
 * - DELETE /api/calendar/events/{eventId} - Delete event
 */
@RestController
@RequestMapping("/api/calendar/events")
@CrossOrigin(origins = "*")
public class CalendarEventController {

    @Autowired
    private CalendarEventService service;

    /**
     * Create a new calendar event
     * 
     * POST /api/calendar/events?userId=1
     * Body: { "eventDate": "2026-02-25", "eventHostName": "John's Wedding", "managedBy": "Sarah", "location": "Grand Hotel" }
     */
    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestParam Long userId,
            @RequestBody CalendarEventDTO dto) {
        try {
            dto.setUserId(userId);
            CalendarEventDTO created = service.createEvent(userId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create event"));
        }
    }

    /**
     * Get events for a user
     * 
     * GET /api/calendar/events?userId=1 - All events
     * GET /api/calendar/events?userId=1&date=2026-02-25 - Events on specific date
     * GET /api/calendar/events?userId=1&startDate=2026-02-01&endDate=2026-02-28 - Events in range
     */
    @GetMapping
    public ResponseEntity<List<CalendarEventDTO>> getEvents(
            @RequestParam Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<CalendarEventDTO> events;

        if (date != null) {
            // Get events for specific date
            events = service.getEventsByDate(userId, date);
        } else if (startDate != null && endDate != null) {
            // Get events in date range
            events = service.getEventsByDateRange(userId, startDate, endDate);
        } else {
            // Get all events
            events = service.getAllEvents(userId);
        }

        return ResponseEntity.ok(events);
    }

    /**
     * Delete an event
     * 
     * DELETE /api/calendar/events/123
     */
    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        try {
            service.deleteEvent(eventId);
            return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete event"));
        }
    }
}
