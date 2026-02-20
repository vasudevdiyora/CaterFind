package org.caterfind.service;

import org.caterfind.dto.CalendarEventDTO;
import org.caterfind.entity.CalendarEvent;
import org.caterfind.repository.CalendarEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Calendar Event Service
 * 
 * Handles business logic for calendar events.
 * Includes scheduled cleanup of events older than 30 days.
 */
@Service
public class CalendarEventService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarEventService.class);

    @Autowired
    private CalendarEventRepository repository;

    @Value("${calendar.cleanup.retention.days:30}")
    private int retentionDays;

    @Value("${calendar.cleanup.enabled:true}")
    private boolean cleanupEnabled;

    /**
     * Create a new calendar event
     */
    public CalendarEventDTO createEvent(Long userId, CalendarEventDTO dto) {
        // Validate: Event date must not be in the past
        if (dto.getEventDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot create events for past dates");
        }

        CalendarEvent event = new CalendarEvent();
        event.setUserId(userId);
        event.setEventDate(dto.getEventDate());
        event.setEventHostName(dto.getEventHostName());
        event.setManagedBy(dto.getManagedBy());
        event.setLocation(dto.getLocation());

        CalendarEvent saved = repository.save(event);
        return toDTO(saved);
    }

    /**
     * Get all events for a user
     */
    public List<CalendarEventDTO> getAllEvents(Long userId) {
        return repository.findByUserIdOrderByEventDateDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get events for a specific date
     */
    public List<CalendarEventDTO> getEventsByDate(Long userId, LocalDate date) {
        return repository.findByUserIdAndEventDate(userId, date)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get events in a date range
     */
    public List<CalendarEventDTO> getEventsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserIdAndEventDateBetweenOrderByEventDateAsc(userId, startDate, endDate)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Delete an event
     */
    public void deleteEvent(Long eventId) {
        repository.deleteById(eventId);
    }

    /**
     * Scheduled cleanup job
     * Runs daily at 2:00 AM to delete events older than retention period
     */
    @Scheduled(cron = "${calendar.cleanup.cron:0 0 2 * * ?}")
    @Transactional
    public void deleteExpiredEvents() {
        if (!cleanupEnabled) {
            logger.debug("Calendar cleanup is disabled");
            return;
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(retentionDays);
        logger.info("Starting calendar event cleanup. Deleting events older than: {}", cutoffDate);

        try {
            int deletedCount = repository.deleteByEventDateBefore(cutoffDate);
            logger.info("Calendar event cleanup completed. Deleted {} expired events", deletedCount);
        } catch (Exception e) {
            logger.error("Error during calendar event cleanup", e);
        }
    }

    /**
     * Convert entity to DTO
     */
    private CalendarEventDTO toDTO(CalendarEvent event) {
        return new CalendarEventDTO(
                event.getId(),
                event.getUserId(),
                event.getEventDate(),
                event.getEventHostName(),
                event.getManagedBy(),
                event.getLocation()
        );
    }
}
