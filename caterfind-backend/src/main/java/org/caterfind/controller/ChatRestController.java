package org.caterfind.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.caterfind.repository.UserRepository;
import org.caterfind.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Return the conversations list for the authenticated user.
     * This mirrors the WebSocket `chat.conversations` payload but exposes it
     * as a simple REST GET so clients that poll can obtain unread counts.
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            var user = userRepository.findByEmail(principal.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

            Long userId = user.getId();
            List<Map<String, Object>> convs = chatService.getUserConversations(userId);
            return ResponseEntity.ok(convs);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
