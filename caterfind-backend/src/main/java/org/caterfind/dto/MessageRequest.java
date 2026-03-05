package org.caterfind.dto;

import java.util.List;

import org.caterfind.entity.Contact;

/**
 * DTO for sending broadcast messages.
 * 
 * Contains list of contact IDs, message text, and source language.
 * 
 * REMINDER: This is NOT a chat system.
 * This is for broadcast messaging only - no threading, no replies.
 */
public class MessageRequest {

    private List<Long> contactIds; // IDs of contacts to send message to
    private String messageText; // Message content
    private Contact.Language sourceLanguage; // Language the caterer is typing in

    // Constructors
    public MessageRequest() {
    }

    public MessageRequest(List<Long> contactIds, String messageText, Contact.Language sourceLanguage) {
        this.contactIds = contactIds;
        this.messageText = messageText;
        this.sourceLanguage = sourceLanguage;
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

    public Contact.Language getSourceLanguage() {
        return sourceLanguage;
    }

    public void setSourceLanguage(Contact.Language sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }
}
