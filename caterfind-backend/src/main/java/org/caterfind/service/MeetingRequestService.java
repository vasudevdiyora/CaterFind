package org.caterfind.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.caterfind.dto.MeetingRequestDTO;
import org.caterfind.dto.MeetingRequestResponse;
import org.caterfind.entity.MeetingRequest;
import org.caterfind.entity.MeetingRequest.RequestStatus;
import org.caterfind.entity.User;
import org.caterfind.repository.MeetingRequestRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    private MeetingRequestNotificationService meetingRequestNotificationService;

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

        meetingRequestNotificationService.notifyRequestCreated(request);

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
            RequestStatus requestStatus = parseStatus(status);
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
            RequestStatus requestStatus = parseStatus(status);
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

    @Transactional(readOnly = true)
    public MeetingRequestResponse getRequestByIdForUser(Long requestId, Long userId, User.UserRole role) {
        MeetingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Meeting request not found"));

        if (role == User.UserRole.ADMIN) {
            return new MeetingRequestResponse(request);
        }

        if (role == User.UserRole.CLIENT && request.getClient().getId().equals(userId)) {
            return new MeetingRequestResponse(request);
        }

        if (role == User.UserRole.CATERER && request.getCaterer().getId().equals(userId)) {
            return new MeetingRequestResponse(request);
        }

        throw new SecurityException("You are not allowed to view this meeting request");
    }

    /**
     * Accept a meeting request.
     * Only the caterer can accept their received requests.
     */
    @Transactional
    public MeetingRequestResponse acceptRequest(Long requestId, Long catererId) {
        MeetingRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Meeting request not found"));

        // Verify the caterer owns this request
        if (!request.getCaterer().getId().equals(catererId)) {
            throw new SecurityException("You can only respond to your own requests");
        }

        // Check if already responded
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been responded to");
        }

        request.setStatus(RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        
        request = requestRepository.save(request);

        meetingRequestNotificationService.notifyRequestAccepted(request);

        return new MeetingRequestResponse(request);
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
            throw new SecurityException("You can only respond to your own requests");
        }

        // Check if already responded
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been responded to");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        
        request = requestRepository.save(request);

        meetingRequestNotificationService.notifyRequestRejected(request);

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

    private RequestStatus parseStatus(String status) {
        try {
            return RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }
}
