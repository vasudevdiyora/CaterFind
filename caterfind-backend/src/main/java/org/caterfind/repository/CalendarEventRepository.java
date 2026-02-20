package org.caterfind.repository;

import org.caterfind.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Calendar Event Repository
 */
@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    /**
     * Find all events for a user
     */
    List<CalendarEvent> findByUserIdOrderByEventDateDesc(Long userId);

    /**
     * Find events for a user on a specific date
     */
    List<CalendarEvent> findByUserIdAndEventDate(Long userId, LocalDate eventDate);

    /**
     * Delete events older than the cutoff date (for cleanup)
     */
    @Modifying
    @Query("DELETE FROM CalendarEvent e WHERE e.eventDate < :cutoffDate")
    int deleteByEventDateBefore(LocalDate cutoffDate);

    /**
     * Find events in a date range for a user
     */
    List<CalendarEvent> findByUserIdAndEventDateBetweenOrderByEventDateAsc(Long userId, LocalDate startDate, LocalDate endDate);
}
