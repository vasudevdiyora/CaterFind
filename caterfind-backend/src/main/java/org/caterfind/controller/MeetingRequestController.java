package org.caterfind.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.caterfind.dto.MeetingRequestDTO;
import org.caterfind.dto.MeetingRequestResponse;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.caterfind.service.MeetingRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for meeting request operations.
 * 
 * Endpoints:
 * - POST /api/meeting-requests - Create new request (client)
 * - GET /api/meeting-requests/caterer - Get caterer's requests
 * - GET /api/meeting-requests/client - Get client's requests  
 * - GET /api/meeting-requests/{id} - Get specific request
 * - PUT /api/meeting-requests/{id}/accept - Accept request (caterer)
 * - PUT /api/meeting-requests/{id}/reject - Reject request (caterer)
 * - GET /api/meeting-requests/pending-count - Get pending count
 * 
 * NOTE: This controller follows the project's pattern of using query parameters
 * for user identification instead of Spring Security sessions.
 */
@RestController
@RequestMapping("/api/meeting-requests")
@CrossOrigin(origins = "*")
public class MeetingRequestController {

    @Autowired
    private MeetingRequestService requestService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new meeting request.
     * POST /api/meeting-requests?clientId={id}
     * 
     * Client sends this when they want to request a meeting with a caterer.
     */
    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestBody MeetingRequestDTO dto,
            @RequestParam Long clientId) {
        try {
            MeetingRequestResponse response = requestService.createRequest(clientId, dto);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get all meeting requests for a caterer.
     * GET /api/meeting-requests/caterer?catererId={id}&status=all|pending|accepted|rejected
     * 
     * Used in the "Clients" page to show all incoming requests.
     */
    @GetMapping("/caterer")
    public ResponseEntity<?> getCatererRequests(
            @RequestParam Long catererId,
            @RequestParam(required = false, defaultValue = "all") String status) {
        try {
            // Verify user is a caterer
            User user = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() != User.UserRole.CATERER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only caterers can access this endpoint"));
            }

            List<MeetingRequestResponse> requests = requestService.getCatererRequests(catererId, status);
            
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get all meeting requests sent by a client.
     * GET /api/meeting-requests/client?clientId={id}&status=all|pending|accepted|rejected
     * 
     * Used by client to track their sent requests.
     */
    @GetMapping("/client")
    public ResponseEntity<?> getClientRequests(
            @RequestParam Long clientId,
            @RequestParam(required = false, defaultValue = "all") String status) {
        try {
            // Verify user is a client
            User user = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() != User.UserRole.CLIENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only clients can access this endpoint"));
            }

            List<MeetingRequestResponse> requests = requestService.getClientRequests(clientId, status);
            
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get a specific meeting request by ID.
     * GET /api/meeting-requests/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id) {
        try {
            MeetingRequestResponse response = requestService.getRequestById(id);
            
            // TODO: Add authorization check (only client or caterer involved in request)
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Accept a meeting request.
     * PUT /api/meeting-requests/{id}/accept?catererId={id}
     * 
     * Only the caterer can accept their received requests.
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptRequest(
            @PathVariable Long id,
            @RequestParam Long catererId) {
        try {
            // Verify user is a caterer
            User user = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() != User.UserRole.CATERER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only caterers can accept requests"));
            }

            MeetingRequestResponse response = requestService.acceptRequest(id, catererId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Reject a meeting request.
     * PUT /api/meeting-requests/{id}/reject?catererId={id}
     * 
     * Only the caterer can reject their received requests.
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @RequestParam Long catererId) {
        try {
            // Verify user is a caterer
            User user = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() != User.UserRole.CATERER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only caterers can reject requests"));
            }

            MeetingRequestResponse response = requestService.rejectRequest(id, catererId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get count of pending requests.
     * GET /api/meeting-requests/pending-count?catererId={id}
     * 
     * Useful for showing badge count in UI.
     */
    @GetMapping("/pending-count")
    public ResponseEntity<?> getPendingCount(@RequestParam Long catererId) {
        try {
            // Verify user is a caterer
            User user = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getRole() != User.UserRole.CATERER) {
                return ResponseEntity.ok(Map.of("count", 0));
            }

            Long count = requestService.getPendingRequestCount(catererId);
            
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
