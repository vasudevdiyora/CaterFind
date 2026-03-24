package org.caterfind.service;

import java.util.List;
import java.util.Objects;
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

    @Autowired
    private SettingsService settingsService;

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
            if (contactId == null) {
                continue;
            }

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
            
            // System.out.println("🔔 Broadcasting to: " + contact.getName());
            // System.out.println("   Source Language: " + sourceLanguage);
            // System.out.println("   Target Language: " + targetLanguage);
            // System.out.println("   Original Message: " + request.getMessageText());
            
            String translatedMessage = translationService.translate(
                request.getMessageText(), 
                sourceLanguage,
                targetLanguage
            );
            
            // System.out.println("   Translated Message: " + translatedMessage);
            // System.out.println("   Contact Method: " + contact.getPreferredContactMethod());

            Message.ContactMethod method = sendUsingPreferenceWithEmailFallback(
                    contact,
                    "Message from Caterer",
                    translatedMessage);
            boolean sent = method != null;

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
     * Send a direct email using the same pipeline as contact messaging.
     * This is used by system workflows (e.g., meeting confirmation) where
     * recipient is not necessarily a saved Contact row.
     */
    public boolean sendDirectEmail(Long catererId, String recipientName, String recipientEmail, String subject, String messageText) {
        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            return false;
        }

        boolean sent;
        try {
            sent = emailService.sendEmail(recipientEmail.trim(), subject, messageText);
        } catch (RuntimeException ex) {
            System.err.println("❌ Failed to send direct email: " + ex.getMessage());
            sent = false;
        }

        Message message = new Message();
        message.setCatererId(catererId);
        message.setContactMethod(Message.ContactMethod.EMAIL);
        message.setMessageText(messageText);
        message.setRecipientName(recipientName != null ? recipientName : recipientEmail);
        message.setStatus(sent ? Message.MessageStatus.SENT : Message.MessageStatus.FAILED);
        messageRepository.save(message);

        return sent;
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
        String recipientPhone = dealerPhone;

        // If linked contact, check preference
        if (contactId != null) {
            Contact contact = contactRepository.findById(contactId).orElse(null);
            if (contact != null) {
                Message.ContactMethod resolvedMethod = sendUsingPreferenceWithEmailFallback(
                        contact,
                        "Reorder Request: " + dealerName,
                        messageText);
                if (resolvedMethod == null) {
                    return false;
                }
                sent = true;
                method = resolvedMethod;
                recipientPhone = contact.getPhone();
            }
        }

        // 2. Send Message
        if (contactId == null) {
            try {
                if (!settingsService.isEnabled("smsEnabled")) {
                    return false;
                }
                if (recipientPhone != null && !recipientPhone.isEmpty()) {
                    sent = smsService.sendSms(recipientPhone, messageText);
                } else {
                    return false;
                }
            } catch (Exception e) {
                System.err.println("❌ Failed to send reorder message: " + e.getMessage());
                return false;
            }
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
                        Long messageContactId = message.getContactId();
                        contactName = contactRepository.findById(Objects.requireNonNull(messageContactId))
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

    private Message.ContactMethod sendUsingPreferenceWithEmailFallback(
            Contact contact,
            String subject,
            String messageText) {
        Contact.ContactMethod preferredMethod = contact.getPreferredContactMethod() != null
                ? contact.getPreferredContactMethod()
                : Contact.ContactMethod.EMAIL;

        try {
            if (preferredMethod == Contact.ContactMethod.SMS
                    && settingsService.isEnabled("smsEnabled")
                    && hasValue(contact.getPhone())
                    && smsService.sendSms(contact.getPhone(), messageText)) {
                return Message.ContactMethod.SMS;
            }

            if (preferredMethod == Contact.ContactMethod.CALL
                    && settingsService.isEnabled("callEnabled")
                    && hasValue(contact.getPhone())) {
                callService.makeCall(contact.getPhone(), messageText);
                return Message.ContactMethod.CALL;
            }

            if (preferredMethod == Contact.ContactMethod.EMAIL
                    && hasValue(contact.getEmail())
                    && emailService.sendEmail(contact.getEmail(), subject, messageText)) {
                return Message.ContactMethod.EMAIL;
            }

            if (hasValue(contact.getEmail())
                    && emailService.sendEmail(contact.getEmail(), subject, messageText)) {
                return Message.ContactMethod.EMAIL;
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send message to " + contact.getName() + ": " + e.getMessage());
            try {
                if (hasValue(contact.getEmail())
                        && emailService.sendEmail(contact.getEmail(), subject, messageText)) {
                    return Message.ContactMethod.EMAIL;
                }
            } catch (Exception ignored) {
                // Email fallback also failed; continue gracefully.
            }
        }

        return null;
    }

    private boolean hasValue(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
