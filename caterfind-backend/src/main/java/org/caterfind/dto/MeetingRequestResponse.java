package org.caterfind.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.caterfind.entity.MeetingRequest;

/**
 * DTO for meeting request responses.
 * Contains full details including client/caterer info.
 */
public class MeetingRequestResponse {
    
    private Long id;
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private Long catererId;
    private String catererName;
    private LocalDate eventDate;
    private Integer numberOfGuests;
    private String eventLocation;
    private String eventType;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime respondedAt;
    private LocalDate meetingDate;
    private LocalTime meetingTime;
    private String meetingPlace;
    private String meetingNotes;
    private Boolean emailSent;
    private Boolean chatMessageSent;
    private String notificationMessage;

    // Constructors
    public MeetingRequestResponse() {
    }

    /**
     * Constructor from entity.
     */
    public MeetingRequestResponse(MeetingRequest request) {
        this.id = request.getId();
        this.clientId = request.getClient().getId();
        this.clientName = request.getClient().getDisplayName();
        this.clientEmail = request.getClient().getEmail();
        this.catererId = request.getCaterer().getId();
        this.catererName = request.getCaterer().getDisplayName();
        this.eventDate = request.getEventDate();
        this.numberOfGuests = request.getNumberOfGuests();
        this.eventLocation = request.getEventLocation();
        this.eventType = request.getEventType();
        this.message = request.getMessage();
        this.status = request.getStatus().name().toLowerCase();
        this.createdAt = request.getCreatedAt();
        this.updatedAt = request.getUpdatedAt();
        this.respondedAt = request.getRespondedAt();
        this.meetingDate = request.getMeetingDate();
        this.meetingTime = request.getMeetingTime();
        this.meetingPlace = request.getMeetingPlace();
        this.meetingNotes = request.getMeetingNotes();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getClientEmail() {
        return clientEmail;
    }

    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }

    public Long getCatererId() {
        return catererId;
    }

    public void setCatererId(Long catererId) {
        this.catererId = catererId;
    }

    public String getCatererName() {
        return catererName;
    }

    public void setCatererName(String catererName) {
        this.catererName = catererName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public LocalDate getMeetingDate() {
        return meetingDate;
    }

    public void setMeetingDate(LocalDate meetingDate) {
        this.meetingDate = meetingDate;
    }

    public LocalTime getMeetingTime() {
        return meetingTime;
    }

    public void setMeetingTime(LocalTime meetingTime) {
        this.meetingTime = meetingTime;
    }

    public String getMeetingPlace() {
        return meetingPlace;
    }

    public void setMeetingPlace(String meetingPlace) {
        this.meetingPlace = meetingPlace;
    }

    public String getMeetingNotes() {
        return meetingNotes;
    }

    public void setMeetingNotes(String meetingNotes) {
        this.meetingNotes = meetingNotes;
    }

    public Boolean getEmailSent() {
        return emailSent;
    }

    public void setEmailSent(Boolean emailSent) {
        this.emailSent = emailSent;
    }

    public Boolean getChatMessageSent() {
        return chatMessageSent;
    }

    public void setChatMessageSent(Boolean chatMessageSent) {
        this.chatMessageSent = chatMessageSent;
    }

    public String getNotificationMessage() {
        return notificationMessage;
    }

    public void setNotificationMessage(String notificationMessage) {
        this.notificationMessage = notificationMessage;
    }
}
