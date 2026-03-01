package org.caterfind.dto;

import java.time.LocalDate;

/**
 * DTO for creating a new meeting request.
 * Used when client sends a request to a caterer.
 */
public class MeetingRequestDTO {
    
    private Long catererId;
    private LocalDate eventDate;
    private Integer numberOfGuests;
    private String eventLocation;
    private String eventType;
    private String message; // Optional

    // Constructors
    public MeetingRequestDTO() {
    }

    // Getters and Setters
    public Long getCatererId() {
        return catererId;
    }

    public void setCatererId(Long catererId) {
        this.catererId = catererId;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public Integer getNumberOfGuests() {
        return numberOfGuests;
    }

    public void setNumberOfGuests(Integer numberOfGuests) {
        this.numberOfGuests = numberOfGuests;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
