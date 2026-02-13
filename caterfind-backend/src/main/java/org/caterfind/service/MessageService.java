package org.caterfind.service;

import org.caterfind.dto.MessageDTO;
import org.caterfind.dto.MessageRequest;
import org.caterfind.entity.Contact;
import org.caterfind.entity.Message;
import org.caterfind.repository.ContactRepository;
import org.caterfind.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Message service for broadcast messaging.
 * 
 * CRITICAL: This is NOT a chat system.
 * 
 * Purpose:
 * - Send broadcast messages to multiple contacts
 * - Use preferred contact method (EMAIL or SMS)
 * - Log all messages for audit trail
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO threading or conversation chains
 * - NO replies or inbox UI
 * - NO real-time chat
 * - NO WhatsApp integration
 * 
 * The caterer selects contacts and sends a message to all of them.
 * Each message is logged separately per contact.
 */
@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private CallService callService;

    /**
     * Send broadcast message to multiple contacts.
     * 
     * For each contact:
     * 1. Check preferred contact method (EMAIL, SMS, or CALL)
     * 2. Call appropriate service
     * 3. Log message in database
     * 
     * @param catererId User ID of the caterer
     * @param request   Message request with contact IDs and message text
     * @return Number of messages sent
     */
    public int sendBroadcastMessage(Long catererId, MessageRequest request) {
        int sentCount = 0;

        System.out.println("📨 Sending broadcast message to " + request.getContactIds().size() + " contact(s)");

        // Iterate through each contact ID
        for (Long contactId : request.getContactIds()) {
            Contact contact = contactRepository.findById(contactId).orElse(null);
            if (contact == null) {
                System.out.println("⚠️ Contact ID " + contactId + " not found");
                continue;
            }

            // Check if contact belongs to this caterer
            if (!contact.getCatererId().equals(catererId)) {
                System.out.println("⚠️ Contact " + contact.getName() + " does not belong to caterer " + catererId);
                continue;
            }

            boolean sent = false;
            Message.ContactMethod method = Message.ContactMethod.EMAIL;

            // Send via preferred contact method
            try {
                if (contact.getPreferredContactMethod() == Contact.ContactMethod.EMAIL) {
                    sent = emailService.sendEmail(
                            contact.getEmail(),
                            "Message from Caterer",
                            request.getMessageText());
                    method = Message.ContactMethod.EMAIL;
                } else if (contact.getPreferredContactMethod() == Contact.ContactMethod.SMS) {
                    sent = smsService.sendSms(
                            contact.getPhone(),
                            request.getMessageText());
                    method = Message.ContactMethod.SMS;
                } else if (contact.getPreferredContactMethod() == Contact.ContactMethod.CALL) {
                    callService.makeCall(
                            contact.getPhone(),
                            request.getMessageText());
                    sent = true; // Assuming no exception means success for now
                    method = Message.ContactMethod.CALL;
                }
            } catch (Exception e) {
                System.err.println(
                        "❌ Failed to send message via " + contact.getPreferredContactMethod() + ": " + e.getMessage());
                sent = false;
            }

            // Log message in database
            if (sent) {
                Message message = new Message();
                message.setCatererId(catererId);
                message.setContactId(contactId);
                message.setMessageText(request.getMessageText());
                message.setContactMethod(method);
                message.setStatus(Message.MessageStatus.SENT);

                messageRepository.save(message);
                sentCount++;
            }
        }

        System.out.println("✅ Successfully sent " + sentCount + " message(s)");
        return sentCount;
    }

    /**
     * Send reorder message to a dealer (Manual or Linked).
     * 
     * @param catererId   Caterer ID
     * @param dealerName  Dealer Name
     * @param dealerPhone Dealer Phone
     * @param contactId   Optional Contact ID (if linked)
     * @param messageText Message content
     * @return true if sent
     */
    public boolean sendReorderMessage(Long catererId, String dealerName, String dealerPhone, Long contactId,
            String messageText) {
        System.out.println("🔄 Sending reorder message to " + dealerName + " (" + dealerPhone + ")");

        boolean sent = false;
        Message.ContactMethod method = Message.ContactMethod.SMS; // Default to SMS

        // 1. Determine method and recipient details
        String recipientEmail = null;
        String recipientPhone = dealerPhone;

        // If linked contact, check preference
        if (contactId != null) {
            Contact contact = contactRepository.findById(contactId).orElse(null);
            if (contact != null) {
                // Use contact's preference
                if (contact.getPreferredContactMethod() == Contact.ContactMethod.EMAIL) {
                    method = Message.ContactMethod.EMAIL;
                    recipientEmail = contact.getEmail();
                } else if (contact.getPreferredContactMethod() == Contact.ContactMethod.CALL) {
                    method = Message.ContactMethod.CALL;
                    recipientPhone = contact.getPhone();
                } else {
                    method = Message.ContactMethod.SMS;
                    recipientPhone = contact.getPhone();
                }
            }
        }

        // 2. Send Message
        try {
            if (method == Message.ContactMethod.EMAIL) {
                if (recipientEmail != null && !recipientEmail.isEmpty()) {
                    sent = emailService.sendEmail(recipientEmail, "Reorder Request: " + dealerName, messageText);
                } else {
                    System.out.println("❌ No email provided for reorder via EMAIL.");
                    return false;
                }
            } else if (method == Message.ContactMethod.CALL) {
                if (recipientPhone != null && !recipientPhone.isEmpty()) {
                    callService.makeCall(recipientPhone, messageText);
                    sent = true;
                } else {
                    System.out.println("❌ No phone number provided for reorder via CALL.");
                    return false;
                }
            } else {
                // SMS
                if (recipientPhone != null && !recipientPhone.isEmpty()) {
                    sent = smsService.sendSms(recipientPhone, messageText);
                } else {
                    System.out.println("❌ No phone number provided for reorder via SMS.");
                    return false;
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send reorder message: " + e.getMessage());
            return false;
        }

        // 3. Log message
        if (sent) {
            Message message = new Message();
            message.setCatererId(catererId);
            message.setMessageText(messageText);
            message.setContactMethod(method);
            message.setStatus(Message.MessageStatus.SENT);

            // Set recipient info
            if (contactId != null) {
                message.setContactId(contactId);
            }
            // Always set manual fields (snapshot of who it was sent to)
            message.setRecipientName(dealerName);
            message.setRecipientPhone(recipientPhone);

            messageRepository.save(message);
            System.out.println("✅ Reorder message logged via " + method);
        }

        return sent;
    }

    /**
     * Get message history for a caterer.
     * Returns all messages sent, ordered by newest first.
     * 
     * This is for audit/logging purposes only.
     * NOT an inbox or chat interface.
     * 
     * @param catererId User ID of the caterer
     * @return List of MessageDTOs
     */
    public List<MessageDTO> getMessageHistory(Long catererId) {
        List<Message> messages = messageRepository.findByCatererIdOrderBySentAtDesc(catererId);

        return messages.stream()
                .map(message -> {
                    // Get contact name for display
                    String contactName = "Unknown";

                    if (message.getContactId() != null) {
                        contactName = contactRepository.findById(message.getContactId())
                                .map(Contact::getName)
                                .orElse(message.getRecipientName() != null ? message.getRecipientName()
                                        : "Unknown Contact");
                    } else if (message.getRecipientName() != null) {
                        contactName = message.getRecipientName();
                    }

                    return new MessageDTO(
                            message.getId(),
                            contactName,
                            message.getMessageText(),
                            message.getContactMethod().name(),
                            message.getSentAt(),
                            message.getStatus().name());
                })
                .collect(Collectors.toList());
    }
}
