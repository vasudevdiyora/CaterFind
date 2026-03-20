package org.caterfind.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.caterfind.entity.MeetingRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class MeetingRequestNotificationService {

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public void notifyRequestCreated(MeetingRequest request) {
        String subject = "New meeting request from " + request.getClient().getDisplayName();
        String body = "You received a new meeting request.\n\n"
                + "Client: " + request.getClient().getDisplayName() + "\n"
                + "Event Date: " + request.getEventDate() + "\n"
                + "Guests: " + request.getNumberOfGuests() + "\n"
                + "Location: " + request.getEventLocation() + "\n"
                + "Event Type: " + request.getEventType() + "\n\n"
                + "Please review it in your CaterFind dashboard.";

        safeSendEmail(request.getCaterer().getEmail(), subject, body);
        sendRealtimeNotification(request.getCaterer().getId(), "REQUEST_CREATED", request);
    }

    public void notifyRequestAccepted(MeetingRequest request) {
        String subject = "Your meeting request was accepted";
        String body = "Good news! Your meeting request has been accepted by "
                + request.getCaterer().getDisplayName() + ".\n\n"
                + "Event Date: " + request.getEventDate() + "\n"
                + "Guests: " + request.getNumberOfGuests() + "\n"
                + "Location: " + request.getEventLocation() + "\n\n"
                + "You can continue discussion from messages.";

        safeSendEmail(request.getClient().getEmail(), subject, body);
        sendRealtimeNotification(request.getClient().getId(), "REQUEST_ACCEPTED", request);
    }

    public void notifyRequestRejected(MeetingRequest request) {
        String subject = "Your meeting request was rejected";
        String body = "Your meeting request has been rejected by "
                + request.getCaterer().getDisplayName() + ".\n\n"
                + "Event Date: " + request.getEventDate() + "\n"
                + "Location: " + request.getEventLocation() + "\n\n"
                + "You can explore other caterers on CaterFind.";

        safeSendEmail(request.getClient().getEmail(), subject, body);
        sendRealtimeNotification(request.getClient().getId(), "REQUEST_REJECTED", request);
    }

    private void safeSendEmail(String toEmail, String subject, String body) {
        try {
            emailService.sendEmail(toEmail, subject, body);
        } catch (Exception ignored) {
            // Notification failures should not block request lifecycle updates.
        }
    }

    private void sendRealtimeNotification(Long userId, String type, MeetingRequest request) {
        if (messagingTemplate == null || userId == null) {
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    buildPayload(type, request));
        } catch (Exception ignored) {
            // WebSocket notification is best effort.
        }
    }

    private Map<String, Object> buildPayload(String type, MeetingRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("requestId", request.getId());
        payload.put("status", request.getStatus().name().toLowerCase());
        payload.put("clientId", request.getClient().getId());
        payload.put("clientName", request.getClient().getDisplayName());
        payload.put("catererId", request.getCaterer().getId());
        payload.put("catererName", request.getCaterer().getDisplayName());
        payload.put("eventDate", request.getEventDate());
        payload.put("eventLocation", request.getEventLocation());
        payload.put("eventType", request.getEventType());
        payload.put("message", request.getMessage());
        payload.put("timestamp", LocalDateTime.now());
        return payload;
    }
}
