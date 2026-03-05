package org.caterfind.service;

import java.util.List;
import java.util.stream.Collectors;

import org.caterfind.dto.MessageDTO;
import org.caterfind.dto.MessageRequest;
import org.caterfind.entity.Contact;
import org.caterfind.entity.Message;
import org.caterfind.repository.ContactRepository;
import org.caterfind.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private VoiceCallService callService;

    @Autowired
    private TranslationService translationService;

    /**
     * Send broadcast message to multiple contacts.
     * 
     * For each contact:
     * 1. Auto-detect message language and translate to contact's preferred language
     * 2. Check preferred contact method (EMAIL, SMS, or CALL)
     * 3. Call appropriate service
     * 4. Log message in database
     * 
     * @param catererId User ID of the caterer
     * @param request   Message request with contact IDs and message text
     * @return Number of messages sent
     */
    public int sendBroadcastMessage(Long catererId, MessageRequest request) {
        int sentCount = 0;

        // Iterate through each contact ID
        for (Long contactId : request.getContactIds()) {
            Contact contact = contactRepository.findById(contactId).orElse(null);
            if (contact == null) {
                continue;
            }

            // Check if contact belongs to this caterer
            if (!contact.getCatererId().equals(catererId)) {
                continue;
            }

            // Translate message to contact's preferred language
            Contact.Language sourceLanguage = request.getSourceLanguage() != null 
                ? request.getSourceLanguage() 
                : Contact.Language.ENGLISH;
            
            Contact.Language targetLanguage = contact.getPreferredLanguage() != null 
                ? contact.getPreferredLanguage() 
                : Contact.Language.ENGLISH;
            
            System.out.println("🔔 Broadcasting to: " + contact.getName());
            System.out.println("   Source Language: " + sourceLanguage);
            System.out.println("   Target Language: " + targetLanguage);
            System.out.println("   Original Message: " + request.getMessageText());
            
            String translatedMessage = translationService.translate(
                request.getMessageText(), 
                sourceLanguage,
                targetLanguage
            );
            
            System.out.println("   Translated Message: " + translatedMessage);
            System.out.println("   Contact Method: " + contact.getPreferredContactMethod());

            // ========================================
            // ✅ ACTUAL SENDING ENABLED
            // ========================================
            boolean sent = false;
            Message.ContactMethod method = contact.getPreferredContactMethod() != null 
                ? Message.ContactMethod.valueOf(contact.getPreferredContactMethod().name())
                : Message.ContactMethod.SMS;
            
            // Send via preferred contact method with fallback
            try {
                if (contact.getPreferredContactMethod() == Contact.ContactMethod.EMAIL) {
                    sent = emailService.sendEmail(
                            contact.getEmail(),
                            "Message from Caterer",
                            translatedMessage);
                    method = Message.ContactMethod.EMAIL;
                } else if (contact.getPreferredContactMethod() == Contact.ContactMethod.SMS) {
                    sent = smsService.sendSms(
                            contact.getPhone(),
                            translatedMessage);
                    method = Message.ContactMethod.SMS;
                } else if (contact.getPreferredContactMethod() == Contact.ContactMethod.CALL) {
                    try {
                        callService.makeCall(
                                contact.getPhone(),
                                translatedMessage);
                        sent = true;
                        method = Message.ContactMethod.CALL;
                    } catch (Exception callException) {
                        // CALL failed, fallback to SMS
                        System.err.println("⚠️ CALL failed for " + contact.getName() + ", falling back to SMS: " + callException.getMessage());
                        try {
                            sent = smsService.sendSms(
                                    contact.getPhone(),
                                    translatedMessage);
                            method = Message.ContactMethod.SMS;
                            System.out.println("✅ Fallback SMS sent successfully to " + contact.getName());
                        } catch (Exception smsException) {
                            // SMS also failed, try EMAIL as last resort
                            System.err.println("⚠️ SMS also failed, trying EMAIL as last resort");
                            if (contact.getEmail() != null && !contact.getEmail().isEmpty()) {
                                sent = emailService.sendEmail(
                                        contact.getEmail(),
                                        "Message from Caterer",
                                        translatedMessage);
                                method = Message.ContactMethod.EMAIL;
                                System.out.println("✅ Fallback EMAIL sent successfully to " + contact.getName());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println(
                        "❌ Failed to send message via " + contact.getPreferredContactMethod() + ": " + e.getMessage());
                sent = false;
            }

            // Log message in database (store translated version)
            if (sent) {
                Message message = new Message();
                message.setCatererId(catererId);
                message.setContactId(contactId);
                message.setMessageText(translatedMessage);
                message.setContactMethod(method);
                message.setStatus(Message.MessageStatus.SENT);

                messageRepository.save(message);
                sentCount++;
            }
        }

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
                    return false;
                }
            } else if (method == Message.ContactMethod.CALL) {
                if (recipientPhone != null && !recipientPhone.isEmpty()) {
                    callService.makeCall(recipientPhone, messageText);
                    sent = true;
                } else {
                    return false;
                }
            } else {
                // SMS
                if (recipientPhone != null && !recipientPhone.isEmpty()) {
                    sent = smsService.sendSms(recipientPhone, messageText);
                } else {
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
