package org.caterfind.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Message entity for logging broadcast messages.
 * 
 * CRITICAL: This is NOT a chat system.
 * 
 * Purpose:
 * - Audit log of all messages sent via the messaging module
 * - Each row = one message sent to one contact
 * - Used for message history and tracking
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO threading or conversation chains
 * - NO replies or inbox UI
 * - NO real-time chat
 * - NO WhatsApp integration
 * 
 * This is a simple broadcast messaging system for internal coordination.
 * The caterer selects contacts and sends a message to all of them.
 * Each message is logged separately per contact for audit purposes.
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Foreign key to User (caterer who sent the message)
    @Column(name = "caterer_id", nullable = false)
    private Long catererId;

    // Foreign key to Contact (recipient) - Nullable for manual entries
    @Column(name = "contact_id", nullable = true)
    private Long contactId;

    // Manual recipient info (used if contactId is null)
    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_phone")
    private String recipientPhone;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    // Method used to send: EMAIL or SMS
    @Enumerated(EnumType.STRING)
    @Column(name = "contact_method", nullable = false)
    private ContactMethod contactMethod;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    // Status: SENT or FAILED (for stub implementation, always SENT)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status = MessageStatus.SENT;

    /**
     * Enum for contact method (matches Contact.ContactMethod).
     */
    public enum ContactMethod {
        EMAIL,
        SMS,
        CALL
    }

    /**
     * Enum for message delivery status.
     * For stub implementation (no real email/SMS), always SENT.
     */
    public enum MessageStatus {
        SENT,
        FAILED
    }

    // Automatically set sentAt timestamp before persisting
    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    // Constructors
    public Message() {
    }

    public Message(Long catererId, Long contactId, String messageText, ContactMethod contactMethod) {
        this.catererId = catererId;
        this.contactId = contactId;
        this.messageText = messageText;
        this.contactMethod = contactMethod;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCatererId() {
        return catererId;
    }

    public void setCatererId(Long catererId) {
        this.catererId = catererId;
    }

    public Long getContactId() {
        return contactId;
    }

    public void setContactId(Long contactId) {
        this.contactId = contactId;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public ContactMethod getContactMethod() {
        return contactMethod;
    }

    public void setContactMethod(ContactMethod contactMethod) {
        this.contactMethod = contactMethod;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }
}
