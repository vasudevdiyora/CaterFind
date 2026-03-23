package org.caterfind.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    @Autowired
    private org.caterfind.service.ChatService chatService;

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
        sendRealtimeNotification(request.getCaterer().getId(), "REQUEST_CREATED", request, null);
    }

    public void notifyRequestAccepted(MeetingRequest request, Double[] coords) {
        String subject = "Your meeting request was accepted";
        StringBuilder body = new StringBuilder();
        body.append("Good news! Your meeting request has been accepted by ")
                .append(request.getCaterer().getDisplayName())
                .append(".\n\n");

        // Prefer explicit meeting details (set by caterer) but fall back to original event details
        if (request.getMeetingDate() != null) {
            body.append("Meeting Date: ").append(request.getMeetingDate()).append("\n");
        } else {
            body.append("Event Date: ").append(request.getEventDate()).append("\n");
        }

        if (request.getMeetingTime() != null) {
            body.append("Meeting Time: ").append(request.getMeetingTime()).append("\n");
        }

        if (request.getMeetingPlace() != null && !request.getMeetingPlace().isBlank()) {
            body.append("Meeting Place: ").append(request.getMeetingPlace()).append("\n");
            body.append("Maps: ");
            String mapsLink;
            if (coords != null && coords.length == 2 && coords[0] != null && coords[1] != null) {
                mapsLink = "https://www.google.com/maps/search/?api=1&query=" + coords[0] + "," + coords[1];
            } else {
                mapsLink = buildGoogleMapsLink(request.getMeetingPlace());
            }
            body.append(mapsLink).append("\n\n");
        } else {
            body.append("Location: ").append(request.getEventLocation()).append("\n\n");
        }

        body.append("You can continue discussion from messages.");
        safeSendEmail(request.getClient().getEmail(), subject, body.toString());
        sendRealtimeNotification(request.getClient().getId(), "REQUEST_ACCEPTED", request, coords);

        // Also publish the acceptance details into the client's chat (so it appears in system chat)
        if (messagingTemplate != null) {
            try {
                // Ensure a conversation exists between caterer and client
                Long catererId = request.getCaterer().getId();
                Long clientId = request.getClient().getId();
                org.caterfind.entity.ChatConversation conv = chatService.getOrCreateConversation(catererId, clientId);

                // Build message text
                StringBuilder msgText = new StringBuilder();
                msgText.append("Meeting accepted by ").append(request.getCaterer().getDisplayName()).append(".\n");
                if (request.getMeetingDate() != null) {
                    msgText.append("Date: ").append(request.getMeetingDate()).append("\n");
                }
                if (request.getMeetingTime() != null) {
                    msgText.append("Time: ").append(request.getMeetingTime()).append("\n");
                }
                if (request.getMeetingPlace() != null && !request.getMeetingPlace().isBlank()) {
                    msgText.append("Place: ").append(request.getMeetingPlace()).append("\n");
                    String mapsLink;
                    if (coords != null && coords.length == 2 && coords[0] != null && coords[1] != null) {
                        mapsLink = "https://www.google.com/maps/search/?api=1&query=" + coords[0] + "," + coords[1];
                    } else {
                        mapsLink = buildGoogleMapsLink(request.getMeetingPlace());
                    }
                    msgText.append("Maps: ").append(mapsLink).append("\n");
                }

                // Persist chat message so history includes it
                org.caterfind.entity.ChatMessage saved = chatService.saveMessage(conv.getId(), catererId, msgText.toString(), "sent");

                // Build DTO and send to both users
                org.caterfind.dto.ChatMessageDTO dto = new org.caterfind.dto.ChatMessageDTO("NEW_MESSAGE");
                dto.setId(saved.getId());
                dto.setConversationId(conv.getId());
                dto.setText(saved.getText());
                dto.setSenderId(catererId);
                dto.setSenderName(chatService.getUserDisplayName(catererId));
                dto.setTimestamp(saved.getCreatedAt());
                dto.setStatus(saved.getStatus());

                messagingTemplate.convertAndSendToUser(clientId.toString(), "/queue/messages", dto);
                try {
                    messagingTemplate.convertAndSendToUser(catererId.toString(), "/queue/messages", dto);
                } catch (Exception ignored) {
                }
            } catch (Exception ignored) {
                // best-effort
            }
        }
    }

    public void notifyRequestRejected(MeetingRequest request) {
        String subject = "Your meeting request was rejected";
        String body = "Your meeting request has been rejected by "
                + request.getCaterer().getDisplayName() + ".\n\n"
                + "Event Date: " + request.getEventDate() + "\n"
                + "Location: " + request.getEventLocation() + "\n\n"
                + "You can explore other caterers on CaterFind.";

        safeSendEmail(request.getClient().getEmail(), subject, body);
        sendRealtimeNotification(request.getClient().getId(), "REQUEST_REJECTED", request, null);
    }

    private void safeSendEmail(String toEmail, String subject, String body) {
        try {
            emailService.sendEmail(toEmail, subject, body);
        } catch (Exception ignored) {
            // Notification failures should not block request lifecycle updates.
        }
    }

    private void sendRealtimeNotification(Long userId, String type, MeetingRequest request, Double[] coords) {
        if (messagingTemplate == null || userId == null) {
            return;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    buildPayload(type, request, coords));
        } catch (Exception ignored) {
            // WebSocket notification is best effort.
        }
    }

    private Map<String, Object> buildPayload(String type, MeetingRequest request, Double[] coords) {
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
        // Include optional meeting details when available
        payload.put("meetingDate", request.getMeetingDate());
        payload.put("meetingTime", request.getMeetingTime());
        payload.put("meetingPlace", request.getMeetingPlace());
        if (request.getMeetingPlace() != null && !request.getMeetingPlace().isBlank()) {
            // Prefer coords provided by caller, otherwise try geocoding
            if (coords != null && coords.length == 2 && coords[0] != null && coords[1] != null) {
                payload.put("meetingLatitude", coords[0]);
                payload.put("meetingLongitude", coords[1]);
                payload.put("mapsLink", "https://www.google.com/maps/search/?api=1&query=" + coords[0] + "," + coords[1]);
            } else {
                Double[] g = geocodePlace(request.getMeetingPlace());
                if (g != null) {
                    payload.put("meetingLatitude", g[0]);
                    payload.put("meetingLongitude", g[1]);
                    payload.put("mapsLink", "https://www.google.com/maps/search/?api=1&query=" + g[0] + "," + g[1]);
                } else {
                    payload.put("mapsLink", buildGoogleMapsLink(request.getMeetingPlace()));
                }
            }
        }
        payload.put("timestamp", LocalDateTime.now());
        return payload;
    }

    private String buildGoogleMapsLink(String place) {
        try {
            // prefer geocoding to get exact coords
            Double[] coords = geocodePlace(place);
            if (coords != null) {
                return "https://www.google.com/maps/search/?api=1&query=" + coords[0] + "," + coords[1];
            }

            String encoded = URLEncoder.encode(place, java.nio.charset.StandardCharsets.UTF_8.toString());
            return "https://www.google.com/maps/search/?api=1&query=" + encoded;
        } catch (Exception e) {
            try {
                return "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(place, java.nio.charset.StandardCharsets.UTF_8.toString());
            } catch (Exception ex) {
                return "https://www.google.com/maps/search/?api=1&query=" + place;
            }
        }
    }

    private Double[] geocodePlace(String place) {
        if (place == null || place.isBlank()) return null;

        try {
            String q = URLEncoder.encode(place, java.nio.charset.StandardCharsets.UTF_8.toString());
            String urlStr = "https://nominatim.openstreetmap.org/search?q=" + q + "&format=json&limit=1";
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "CaterFind/1.0 (your-email@example.com)");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int status = conn.getResponseCode();
            if (status != 200) return null;

            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder resp = new StringBuilder();
            String line;
            while ((line = in.readLine()) != null) resp.append(line);
            in.close();

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String,Object>> list = mapper.readValue(resp.toString(), new TypeReference<List<Map<String,Object>>>(){});
            if (list == null || list.isEmpty()) return null;
            Map<String,Object> first = list.get(0);
            if (first.containsKey("lat") && first.containsKey("lon")) {
                double lat = Double.parseDouble(first.get("lat").toString());
                double lon = Double.parseDouble(first.get("lon").toString());
                return new Double[] { lat, lon };
            }
        } catch (Exception ignored) {
            // Geocoding failure should not break flow
        }
        return null;
    }
}
