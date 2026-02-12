package org.caterfind.controller;

import org.caterfind.dto.MessageDTO;
import org.caterfind.dto.MessageRequest;
import org.caterfind.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Message controller for broadcast messaging.
 * 
 * Endpoints:
 * - POST /messages/send - Send broadcast message
 * - GET /messages/logs - View message history
 * 
 * CRITICAL: This is NOT a chat system.
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO threading or conversation chains
 * - NO replies or inbox UI
 * - NO real-time chat
 * - NO WhatsApp integration
 * 
 * This is for broadcast messaging only.
 * Caterer selects contacts and sends a message to all of them.
 */
@RestController
@RequestMapping("/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageService messageService;

    /**
     * Send broadcast message to multiple contacts.
     * 
     * For each contact:
     * - Uses their preferred contact method (EMAIL or SMS)
     * - Calls stub EmailService or SmsService
     * - Logs message in database
     * 
     * @param catererId User ID of the caterer
     * @param request   Message request with contact IDs and message text
     * @return Response with number of messages sent
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendBroadcastMessage(
            @RequestParam Long catererId,
            @RequestBody MessageRequest request) {

        int sentCount = messageService.sendBroadcastMessage(catererId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("messagesSent", sentCount);
        response.put("message", "Broadcast message sent to " + sentCount + " contact(s)");

        return ResponseEntity.ok(response);
    }

    /**
     * Send reorder message to dealer.
     * 
     * @param catererId Caterer ID
     * @param request   Reorder request details
     * @return Success response
     */
    @PostMapping("/reorder")
    public ResponseEntity<Map<String, Object>> sendReorderMessage(
            @RequestParam Long catererId,
            @RequestBody org.caterfind.dto.ReorderRequest request) { // Use fully qualified name if import is missing

        boolean success = messageService.sendReorderMessage(
                catererId,
                request.getDealerName(),
                request.getDealerPhone(),
                request.getDealerContactId(),
                request.getMessageText());

        Map<String, Object> response = new HashMap<>();
        if (success) {
            response.put("success", true);
            response.put("message", "Reorder request sent to " + request.getDealerName());
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Failed to send reorder. Check phone number.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get message history for a caterer.
     * 
     * Returns all messages sent, ordered by newest first.
     * This is for audit/logging purposes only.
     * NOT an inbox or chat interface.
     * 
     * @param catererId User ID of the caterer
     * @return List of MessageDTOs
     */
    @GetMapping("/logs")
    public ResponseEntity<List<MessageDTO>> getMessageHistory(@RequestParam Long catererId) {
        List<MessageDTO> messages = messageService.getMessageHistory(catererId);
        return ResponseEntity.ok(messages);
    }
}
