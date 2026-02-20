package org.caterfind.entity;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Calendar Event Entity
 * 
 * Stores events added to the availability calendar by caterers.
 * Events older than 30 days are automatically cleaned up.
 */
@Entity
@Table(name = "calendar_events", indexes = {
    @Index(name = "idx_user_date", columnList = "user_id, event_date"),
    @Index(name = "idx_event_date", columnList = "event_date")
})
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "event_host_name", nullable = false)
    private String eventHostName;

    @Column(name = "managed_by")
    private String managedBy;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
