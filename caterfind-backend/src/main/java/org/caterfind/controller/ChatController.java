package org.caterfind.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.caterfind.dto.ChatMessageDTO;
import org.caterfind.entity.ChatConversation;
import org.caterfind.entity.ChatMessage;
import org.caterfind.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;

/**
 * WebSocket Chat Controller
 * Handles real-time messaging between clients and caterers
 */
@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private SimpUserRegistry simpUserRegistry;



    /**
     * Handle incoming chat messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO message, SimpMessageHeaderAccessor headerAccessor) {
        
        
        // Determine actual conversation ID
        Long actualConversationId = message.getConversationId();
        
        // If conversationId is null or equals recipientId, treat as a temporary placeholder
        // and get or create the real conversation in the DB.
        if (actualConversationId == null || (actualConversationId != null && actualConversationId.equals(message.getRecipientId()))) {
            // Get or create conversation in database
            ChatConversation conversation = chatService.getOrCreateConversation(
                message.getSenderId(),
                message.getRecipientId()
            );
            actualConversationId = conversation.getId();
            
            // Send conversation object to both users with the message
            sendConversationToBothUsers(actualConversationId, message.getSenderId(), message.getRecipientId(), message.getText(), LocalDateTime.now());
        }

        // Save message to database
        ChatMessage savedMessage = chatService.saveMessage(
            actualConversationId, 
            message.getSenderId(), 
            message.getText(), 
            "sent"
        );

        // If recipient currently has an active WebSocket session, mark as delivered server-side
        try {
            if (message.getRecipientId() != null && simpUserRegistry.getUser(message.getRecipientId().toString()) != null) {
                savedMessage = chatService.markMessageDelivered(savedMessage.getId());
            }
        } catch (Exception ex) {
            // best-effort: if SimpUserRegistry not available or error occurs, ignore
        }

        // Send to recipient
        ChatMessageDTO newMessage = new ChatMessageDTO("NEW_MESSAGE");
        newMessage.setId(savedMessage.getId());
        newMessage.setConversationId(actualConversationId);
        newMessage.setText(savedMessage.getText());
        newMessage.setSenderId(savedMessage.getSenderId());
        newMessage.setSenderName(chatService.getUserDisplayName(savedMessage.getSenderId()));
        newMessage.setTimestamp(savedMessage.getCreatedAt());
        newMessage.setStatus(savedMessage.getStatus());
        // Echo back clientMessageId if the sender provided one so the client can reconcile optimistic messages
        try {
            newMessage.setClientMessageId(message.getClientMessageId());
        } catch (Exception ignore) {
        }

        
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
            message.getRecipientId().toString(),
            "/queue/messages",
            newMessage
        );

        // Also send the full message to the sender so the UI receives the persisted message
        // (prevents optimistic UI from being overwritten without persisted data)
        try {
            messagingTemplate.convertAndSendToUser(
                message.getSenderId().toString(),
                "/queue/messages",
                newMessage
            );
        } catch (Exception ex) {
            System.err.println("Failed to send persisted message to sender: " + ex.getMessage());
        }
        // Send confirmation back to sender
        ChatMessageDTO confirmation = new ChatMessageDTO("MESSAGE_SENT");
        confirmation.setId(savedMessage.getId());
        confirmation.setConversationId(actualConversationId);
        confirmation.setClientMessageId(message.getClientMessageId());
        messagingTemplate.convertAndSendToUser(
            message.getSenderId().toString(),
            "/queue/messages",
            confirmation
        );
        
        
    }

    /**
     * Handle delivery/read acknowledgements from clients.
     * Payload: { type: 'DELIVERED'|'READ', messageId: <id>, conversationId: <id>, userId: <userId> }
     */
    @MessageMapping("/chat.ack")
    public void handleAck(@Payload Map<String, Object> ack, SimpMessageHeaderAccessor headerAccessor) {
        try {
            String type = ack.get("type").toString();
            Long messageId = Long.parseLong(ack.get("messageId").toString());
            Long ackingUserId = null;
            try {
                if (ack.get("userId") != null) ackingUserId = Long.parseLong(ack.get("userId").toString());
            } catch (Exception ignore) {
            }
            

            ChatMessage updated = null;
            if ("DELIVERED".equalsIgnoreCase(type)) {
                updated = chatService.markMessageDelivered(messageId);
            } else if ("READ".equalsIgnoreCase(type)) {
                updated = chatService.markMessageRead(messageId);
            }

            if (updated != null) {
                // notify the sender of the message about new status
                ChatMessageDTO dto = new ChatMessageDTO("MESSAGE_STATUS_UPDATE");
                dto.setId(updated.getId());
                dto.setConversationId(updated.getConversationId());
                dto.setStatus(updated.getStatus());
                dto.setTimestamp(updated.getCreatedAt());
                dto.setDeliveredAt(updated.getDeliveredAt());
                dto.setReadAt(updated.getReadAt());

                Long senderId = updated.getSenderId();
                try {
                    messagingTemplate.convertAndSendToUser(
                        senderId.toString(),
                        "/queue/messages",
                        dto
                    );
                } catch (Exception ignored) {
                }

                // If message was marked READ, also notify both participants with updated conversation info
                if ("read".equalsIgnoreCase(updated.getStatus()) && ackingUserId != null) {
                    try {
                        
                        sendConversationToBothUsers(updated.getConversationId(), updated.getSenderId(), ackingUserId, updated.getText(), updated.getCreatedAt());
                        
                    } catch (Exception e) {
                        System.err.println("Failed to send conversation update after READ ack: " + e.getMessage());
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Error processing ack: " + ex.getMessage());
        }
    }
    
    /**
     * Send conversation object to both users
     */
    private void sendConversationToBothUsers(Long conversationId, Long userId1, Long userId2, String lastMessage, LocalDateTime lastMessageTime) {
        // Get conversation details from database; if missing, skip sending
        Map<String, Object> conv1;
        Map<String, Object> conv2;
        try {
            conv1 = chatService.getConversationDetails(conversationId, userId1);
            conv2 = chatService.getConversationDetails(conversationId, userId2);
        } catch (org.caterfind.exception.ResourceNotFoundException ex) {
            
            return;
        }
        
        // Update with current message
        conv1.put("lastMessage", lastMessage);
        conv1.put("lastMessageTime", lastMessageTime);
        
        conv2.put("lastMessage", lastMessage);
        conv2.put("lastMessageTime", lastMessageTime);
        
        Map<String, Object> response1 = new HashMap<>();
        response1.put("type", "CONVERSATION_STARTED");
        response1.put("conversation", conv1);
        
        messagingTemplate.convertAndSendToUser(
            userId1.toString(),
            "/queue/messages",
            response1
        );
        
        Map<String, Object> response2 = new HashMap<>();
        response2.put("type", "CONVERSATION_STARTED");
        response2.put("conversation", conv2);
        
        messagingTemplate.convertAndSendToUser(
            userId2.toString(),
            "/queue/messages",
            response2
        );
        
        
    }

    /**
     * Get conversations list for a user
     */
    @MessageMapping("/chat.conversations")
    public void getConversations(@Payload Map<String, Object> request, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = Long.parseLong(request.get("userId").toString());
        
        
        
        // Get conversations from database
        List<Map<String, Object>> userConversationsList = chatService.getUserConversations(userId);
        
        
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "CONVERSATIONS_LIST");
        response.put("conversations", userConversationsList);

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/messages",
            response
        );
    }

    /**
     * Get message history for a conversation
     */
    @MessageMapping("/chat.history")
    public void getMessageHistory(@Payload Map<String, Object> request, SimpMessageHeaderAccessor headerAccessor) {
        Long conversationId = Long.parseLong(request.get("conversationId").toString());
        Long userId = Long.parseLong(request.get("userId").toString());
        // Fetch full message history for the conversation (do not filter by 'since')
        
        List<ChatMessageDTO> messages = chatService.getMessageHistory(conversationId);
        

        Map<String, Object> response = new HashMap<>();
        response.put("type", "MESSAGE_HISTORY");
        response.put("conversationId", conversationId);
        response.put("messages", messages);

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/messages",
            response
        );
    }

    /**
     * Start a new conversation
     */
    @MessageMapping("/chat.start")
    public void startConversation(@Payload Map<String, Object> request, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = Long.parseLong(request.get("userId").toString());
        Long recipientId = Long.parseLong(request.get("recipientId").toString());
        
        // Get or create conversation in database
        ChatConversation conversation = chatService.getOrCreateConversation(userId, recipientId);
        
        // Get conversation details and send to user; if missing, log and skip
        try {
            Map<String, Object> conversationData = chatService.getConversationDetails(conversation.getId(), userId);
            Map<String, Object> response = new HashMap<>();
            response.put("type", "CONVERSATION_STARTED");
            response.put("conversation", conversationData);

            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/messages",
                response
            );
        } catch (org.caterfind.exception.ResourceNotFoundException ex) {
            
        }
    }

    /**
     * User connected event
     */
    @MessageMapping("/chat.connect")
    @SendTo("/topic/public")
    public Map<String, Object> handleConnect(@Payload Map<String, Object> connectMessage) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "USER_CONNECTED");
        response.put("userId", connectMessage.get("userId"));
        return response;
    }

    /**
     * User disconnected event
     */
    @MessageMapping("/chat.disconnect")
    @SendTo("/topic/public")
    public Map<String, Object> handleDisconnect(@Payload Map<String, Object> disconnectMessage) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "USER_DISCONNECTED");
        response.put("userId", disconnectMessage.get("userId"));
        return response;
    }
}
