package org.caterfind.service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.caterfind.dto.ChatMessageDTO;
import org.caterfind.dto.MeetingRequestDTO;
import org.caterfind.dto.MeetingRequestResponse;
import org.caterfind.dto.MeetingScheduleDTO;
import org.caterfind.entity.ChatConversation;
import org.caterfind.entity.ChatMessage;
import org.caterfind.entity.MeetingRequest;
import org.caterfind.entity.MeetingRequest.RequestStatus;
import org.caterfind.entity.User;
import org.caterfind.repository.MeetingRequestRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling meeting request business logic.
 */
@Service
public class MeetingRequestService {

    @Autowired
    private MeetingRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ChatService chatService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Create a new meeting request.
     * Called by client when they want to request a meeting with a caterer.
     */
    @Transactional
    public MeetingRequestResponse createRequest(Long clientId, MeetingRequestDTO dto) {
        // Validate client
        User client = userRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Client not found"));
        
        if (client.getRole() != User.UserRole.CLIENT) {
            throw new RuntimeException("Only clients can create meeting requests");
        }

        // Validate caterer
        User caterer = userRepository.findById(dto.getCatererId())
            .orElseThrow(() -> new RuntimeException("Caterer not found"));
        
        if (caterer.getRole() != User.UserRole.CATERER) {
            throw new RuntimeException("Meeting requests can only be sent to caterers");
        }

        // Create request
        MeetingRequest request = new MeetingRequest();
        request.setClient(client);
        request.setCaterer(caterer);
        request.setEventDate(dto.getEventDate());
        request.setNumberOfGuests(dto.getNumberOfGuests());
        request.setEventLocation(dto.getEventLocation());
        request.setEventType(dto.getEventType());
        request.setMessage(dto.getMessage());
        request.setStatus(RequestStatus.PENDING);

        request = requestRepository.save(request);

        // TODO: Send notification to caterer (email/push/websocket)

        return new MeetingRequestResponse(request);
    }

    /**
     * Get all meeting requests for a caterer.
     * Used in the "Clients" page to show all incoming requests.
     */
    @Transactional(readOnly = true)
    public List<MeetingRequestResponse> getCatererRequests(Long catererId, String status) {
        List<MeetingRequest> requests;
        
        if (status != null && !status.equalsIgnoreCase("all")) {
            RequestStatus requestStatus = RequestStatus.valueOf(status.toUpperCase());
            requests = requestRepository.findByCatererIdAndStatus(catererId, requestStatus);
        } else {
            requests = requestRepository.findByCatererId(catererId);
        }

        return requests.stream()
            .map(MeetingRequestResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Get all meeting requests sent by a client.
     * Used by client to track their sent requests.
     */
    @Transactional(readOnly = true)
    public List<MeetingRequestResponse> getClientRequests(Long clientId, String status) {
        List<MeetingRequest> requests;
        
        if (status != null && !status.equalsIgnoreCase("all")) {
            RequestStatus requestStatus = RequestStatus.valueOf(status.toUpperCase());
            requests = requestRepository.findByClientIdAndStatus(clientId, requestStatus);
        } else {
            requests = requestRepository.findByClientId(clientId);
        }

        return requests.stream()
            .map(MeetingRequestResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Get a specific meeting request by ID.
     */
    @Transactional(readOnly = true)
    public MeetingRequestResponse getRequestById(Long requestId) {
        MeetingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Meeting request not found"));
        
        return new MeetingRequestResponse(request);
    }

    /**
     * Accept a meeting request.
     * Only the caterer can accept their received requests.
     */
    @Transactional
    public MeetingRequestResponse acceptRequest(Long requestId, Long catererId, MeetingScheduleDTO meetingSchedule) {
        MeetingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Meeting request not found"));

        // Verify the caterer owns this request
        if (!request.getCaterer().getId().equals(catererId)) {
            throw new RuntimeException("You can only respond to your own requests");
        }

        // Check if already responded
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been responded to");
        }

        if (meetingSchedule == null) {
            throw new RuntimeException("Meeting schedule is required to accept request");
        }

        if (meetingSchedule.getMeetingDate() == null || meetingSchedule.getMeetingDate().trim().isEmpty()) {
            throw new RuntimeException("Meeting date is required");
        }

        if (meetingSchedule.getMeetingTime() == null || meetingSchedule.getMeetingTime().trim().isEmpty()) {
            throw new RuntimeException("Meeting time is required");
        }

        if (meetingSchedule.getMeetingPlace() == null || meetingSchedule.getMeetingPlace().trim().isEmpty()) {
            throw new RuntimeException("Meeting place is required");
        }

        request.setStatus(RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        request.setMeetingDate(LocalDate.parse(meetingSchedule.getMeetingDate()));
        request.setMeetingTime(LocalTime.parse(meetingSchedule.getMeetingTime()));
        request.setMeetingPlace(meetingSchedule.getMeetingPlace().trim());
        request.setMeetingNotes(meetingSchedule.getMeetingNotes());
        
        request = requestRepository.save(request);

        boolean emailSent = sendMeetingConfirmationEmail(request);
        boolean chatMessageSent = sendMeetingConfirmationChat(request);

        MeetingRequestResponse response = new MeetingRequestResponse(request);
        response.setEmailSent(emailSent);
        response.setChatMessageSent(chatMessageSent);
        response.setNotificationMessage(buildCatererAcknowledgement(emailSent, chatMessageSent));

        return response;
    }

    /**
     * Reject a meeting request.
     * Only the caterer can reject their received requests.
     */
    @Transactional
    public MeetingRequestResponse rejectRequest(Long requestId, Long catererId) {
        MeetingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Meeting request not found"));

        // Verify the caterer owns this request
        if (!request.getCaterer().getId().equals(catererId)) {
            throw new RuntimeException("You can only respond to your own requests");
        }

        // Check if already responded
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been responded to");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        
        request = requestRepository.save(request);

        // TODO: Send notification to client (email/push/websocket)

        return new MeetingRequestResponse(request);
    }

    /**
     * Get count of pending requests for a caterer.
     * Useful for showing badge count in UI.
     */
    @Transactional(readOnly = true)
    public Long getPendingRequestCount(Long catererId) {
        return requestRepository.countPendingByCatererId(catererId);
    }

    private boolean sendMeetingConfirmationEmail(MeetingRequest request) {
        String clientEmail = request.getClient().getEmail();
        if (clientEmail == null || clientEmail.trim().isEmpty()) {
            return false;
        }

        String subject = "Meeting confirmed for your " + request.getEventType() + " request";
        String body = buildMeetingConfirmationEmailBody(request);
        return messageService.sendDirectEmail(
            request.getCaterer().getId(),
            request.getClient().getDisplayName(),
            clientEmail,
            subject,
            body
        );
    }

    private boolean sendMeetingConfirmationChat(MeetingRequest request) {
        try {
            Long catererId = request.getCaterer().getId();
            Long clientId = request.getClient().getId();

            ChatConversation conversation = chatService.getOrCreateConversation(catererId, clientId);
            ChatMessage savedMessage = chatService.saveMessage(
                conversation.getId(),
                catererId,
                buildMeetingConfirmationChatText(request),
                "sent"
            );

            if (messagingTemplate != null) {
                sendConversationStartedEvent(conversation.getId(), catererId, clientId);

                ChatMessageDTO realtimeMessage = new ChatMessageDTO("NEW_MESSAGE");
                realtimeMessage.setId(savedMessage.getId());
                realtimeMessage.setConversationId(conversation.getId());
                realtimeMessage.setSenderId(catererId);
                realtimeMessage.setSenderName(chatService.getUserDisplayName(catererId));
                realtimeMessage.setText(savedMessage.getText());
                realtimeMessage.setTimestamp(savedMessage.getCreatedAt());
                realtimeMessage.setStatus(savedMessage.getStatus());

                messagingTemplate.convertAndSendToUser(clientId.toString(), "/queue/messages", realtimeMessage);
            }

            return true;
        } catch (RuntimeException ex) {
            System.err.println("Failed to send meeting details in chat: " + ex.getMessage());
            return false;
        }
    }

    private String buildMeetingConfirmationEmailBody(MeetingRequest request) {
        String clientName = request.getClient().getDisplayName();
        String catererName = request.getCaterer().getDisplayName();
        String meetingDate = request.getMeetingDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String meetingTime = request.getMeetingTime().format(DateTimeFormatter.ofPattern("hh:mm a"));

        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(clientName).append(",\n\n");
        body.append("Your meeting request has been accepted.\n\n");
        body.append("Meeting Confirmation\n");
        body.append("--------------------------------\n");
        body.append("Caterer: ").append(catererName).append("\n");
        body.append("Event Type: ").append(request.getEventType()).append("\n");
        body.append("Meeting Date: ").append(meetingDate).append("\n");
        body.append("Meeting Time: ").append(meetingTime).append("\n");
        body.append("Meeting Location: ").append(request.getMeetingPlace()).append("\n");

        if (request.getMeetingNotes() != null && !request.getMeetingNotes().trim().isEmpty()) {
            body.append("Notes: ").append(request.getMeetingNotes().trim()).append("\n");
        }

        body.append("\nPlease keep this confirmation for your reference.\n");
        body.append("We look forward to meeting you.\n\n");
        body.append("Regards,\n");
        body.append(catererName).append("\n");
        body.append("CaterFind");

        return body.toString();
    }

    private String buildMeetingConfirmationChatText(MeetingRequest request) {
        String meetingDate = request.getMeetingDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String meetingTime = request.getMeetingTime().format(DateTimeFormatter.ofPattern("hh:mm a"));

        StringBuilder message = new StringBuilder();
        message.append("Meeting confirmed\n\n");
        message.append("Your request for ").append(request.getEventType()).append(" has been accepted.\n\n");
        message.append("Meeting details:\n");
        message.append("- Date: ").append(meetingDate).append("\n");
        message.append("- Time: ").append(meetingTime).append("\n");
        message.append("- Location: ").append(request.getMeetingPlace()).append("\n");
        if (request.getMeetingNotes() != null && !request.getMeetingNotes().trim().isEmpty()) {
            message.append("- Notes: ").append(request.getMeetingNotes().trim()).append("\n");
        }
        message.append("\nPlease let me know if you need any updates.");

        return message.toString();
    }

    private String buildCatererAcknowledgement(boolean emailSent, boolean chatMessageSent) {
        if (emailSent && chatMessageSent) {
            return "Meeting fixed successfully. Details were sent to the client via email and chat.";
        }

        if (emailSent) {
            return "Meeting fixed successfully. Details were sent to the client via email. Chat delivery is pending.";
        }

        if (chatMessageSent) {
            return "Meeting fixed successfully. Details were sent to the client in chat. Email delivery is pending.";
        }

        return "Meeting fixed successfully, but automatic delivery failed. Please share details with the client manually.";
    }

    private void sendConversationStartedEvent(Long conversationId, Long catererId, Long clientId) {
        Map<String, Object> clientConversation = chatService.getConversationDetails(conversationId, clientId);
        if (clientConversation != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CONVERSATION_STARTED");
            payload.put("conversation", clientConversation);
            messagingTemplate.convertAndSendToUser(clientId.toString(), "/queue/messages", payload);
        }

        Map<String, Object> catererConversation = chatService.getConversationDetails(conversationId, catererId);
        if (catererConversation != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CONVERSATION_STARTED");
            payload.put("conversation", catererConversation);
            messagingTemplate.convertAndSendToUser(catererId.toString(), "/queue/messages", payload);
        }
    }
}
