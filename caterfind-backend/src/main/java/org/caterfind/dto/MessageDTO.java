package org.caterfind.dto;

import java.time.LocalDateTime;

/**
 * DTO for Message entity (for message logs display).
 * 
 * Used to show message history in the frontend.
 */
public class MessageDTO {

    private Long id;
    private String contactName;
    private String messageText;
    private String contactMethod; // "EMAIL" or "SMS"
    private LocalDateTime sentAt;
    private String status; // "SENT" or "FAILED"

    // Constructors
    public MessageDTO() {
    }

    public MessageDTO(Long id, String contactName, String messageText,
            String contactMethod, LocalDateTime sentAt, String status) {
        this.id = id;
        this.contactName = contactName;
        this.messageText = messageText;
        this.contactMethod = contactMethod;
        this.sentAt = sentAt;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public String getContactMethod() {
        return contactMethod;
    }

    public void setContactMethod(String contactMethod) {
        this.contactMethod = contactMethod;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
