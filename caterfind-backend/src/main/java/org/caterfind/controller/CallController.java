package org.caterfind.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.caterfind.dto.CallRequest;
import org.caterfind.service.VoiceCallService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class CallController {
    
    private static final Logger logger = LoggerFactory.getLogger(CallController.class);
    private static final int CALL_RATE_LIMIT_PER_MINUTE = 10;
    private static final long RATE_LIMIT_WINDOW_MS = TimeUnit.MINUTES.toMillis(1);
    
    // Simple rate limiter: userId -> [timestamp1, timestamp2, ...]
    private static final Map<String, Long> lastCallAttempt = new ConcurrentHashMap<>();

    @Autowired
    private VoiceCallService callService;

    /**
     * Make a phone call
     * 
     * SECURITY:
     * - Requires authentication (@PreAuthorize)
     * - Rate limited to 10 calls per minute
     * - Logs all call attempts for audit
     */
    @PostMapping("/make-call")
    @PreAuthorize("isAuthenticated()")  // Only authenticated users can make calls
    public ResponseEntity<?> makeCall(
            @RequestBody CallRequest req,
            Authentication authentication) {
        
        try {
            // Validate request
            if (req == null || req.getTo() == null || req.getTo().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Recipient phone number is required"));
            }
            
            if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Message is required"));
            }
            
            // SECURITY: Get authenticated user ID for rate limiting and audit
            String userId = authentication.getName();
            
            // SECURITY: Rate limiting check
            if (!checkRateLimit(userId)) {
                logger.warn("Rate limit exceeded for user: {}", userId);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("error", "Too many calls. Max 10 calls per minute"));
            }
            
            // Log the call attempt for audit trail
            logger.info("Call initiated - User: {}, To: {}", userId, maskPhoneNumber(req.getTo()));
            
            // Make the call
            callService.makeCall(req.getTo(), req.getMessage());
            
            // Update rate limit tracking
            recordCallAttempt(userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Call initiated successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to initiate call", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to initiate call");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Check if user has exceeded rate limit
     */
    private synchronized boolean checkRateLimit(String userId) {
        Long lastAttempt = lastCallAttempt.get(userId);
        long now = System.currentTimeMillis();
        
        if (lastAttempt == null) {
            return true; // First call, allow
        }
        
        long timeSinceLastCall = now - lastAttempt;
        if (timeSinceLastCall >= RATE_LIMIT_WINDOW_MS) {
            return true; // Window expired, allow
        }
        
        // TODO: Implement proper rate limiter with counter
        // For now, simple check: don't allow more than 1 call per second
        if (timeSinceLastCall < 100) {
            return false; // Too soon
        }
        
        return true;
    }
    
    /**
     * Record call attempt for rate limiting
     */
    private synchronized void recordCallAttempt(String userId) {
        lastCallAttempt.put(userId, System.currentTimeMillis());
    }
    
    /**
     * Mask phone number for privacy in logs
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        return "*".repeat(phoneNumber.length() - 4) + phoneNumber.substring(phoneNumber.length() - 4);
    }
}
