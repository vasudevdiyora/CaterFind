package org.caterfind.dto;

import java.time.LocalDate;

/**
 * Calendar Event DTO
 * 
 * Data transfer object for calendar events.
 */
public class CalendarEventDTO {

    private Long id;
    private Long userId;
    private LocalDate eventDate;
    private String eventHostName;
    private String managedBy;
    private String location;

    // Constructors
    public CalendarEventDTO() {
    }

    public CalendarEventDTO(Long id, Long userId, LocalDate eventDate, String eventHostName, String managedBy, String location) {
        this.id = id;
        this.userId = userId;
        this.eventDate = eventDate;
        this.eventHostName = eventHostName;
        this.managedBy = managedBy;
        this.location = location;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getEventHostName() {
        return eventHostName;
    }

    public void setEventHostName(String eventHostName) {
        this.eventHostName = eventHostName;
    }

    public String getManagedBy() {
        return managedBy;
    }

    public void setManagedBy(String managedBy) {
        this.managedBy = managedBy;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
