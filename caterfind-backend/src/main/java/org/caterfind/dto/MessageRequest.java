package org.caterfind.dto;

import java.util.List;

/**
 * DTO for sending broadcast messages.
 * 
 * Contains list of contact IDs and message text.
 * 
 * REMINDER: This is NOT a chat system.
 * This is for broadcast messaging only - no threading, no replies.
 */
public class MessageRequest {

    private List<Long> contactIds; // IDs of contacts to send message to
    private String messageText; // Message content

    // Constructors
    public MessageRequest() {
    }

    public MessageRequest(List<Long> contactIds, String messageText) {
        this.contactIds = contactIds;
        this.messageText = messageText;
    }

    // Getters and Setters
    public List<Long> getContactIds() {
        return contactIds;
    }

    public void setContactIds(List<Long> contactIds) {
        this.contactIds = contactIds;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }
}
