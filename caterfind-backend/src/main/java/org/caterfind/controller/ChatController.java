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



    /**
     * Handle incoming chat messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO message, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("Received message from " + message.getSenderId() + " to " + message.getRecipientId());
        
        // Determine actual conversation ID
        Long actualConversationId = message.getConversationId();
        
        // If conversationId is the same as recipientId, this is likely a temp conversation
        // We need to get or create the real conversation
        if (actualConversationId != null && actualConversationId.equals(message.getRecipientId())) {
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

        // Send to recipient
        ChatMessageDTO newMessage = new ChatMessageDTO("NEW_MESSAGE");
        newMessage.setId(savedMessage.getId());
        newMessage.setConversationId(actualConversationId);
        newMessage.setText(savedMessage.getText());
        newMessage.setSenderId(savedMessage.getSenderId());
        newMessage.setSenderName(chatService.getUserDisplayName(savedMessage.getSenderId()));
        newMessage.setTimestamp(savedMessage.getCreatedAt());
        newMessage.setStatus(savedMessage.getStatus());

        System.out.println("Sending message to user: " + message.getRecipientId() + " with conversation: " + actualConversationId);
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
            message.getRecipientId().toString(),
            "/queue/messages",
            newMessage
        );

        // Send confirmation back to sender
        ChatMessageDTO confirmation = new ChatMessageDTO("MESSAGE_SENT");
        confirmation.setId(savedMessage.getId());
        confirmation.setConversationId(actualConversationId);
        messagingTemplate.convertAndSendToUser(
            message.getSenderId().toString(),
            "/queue/messages",
            confirmation
        );
        
        System.out.println("Message sent and saved successfully");
    }
    
    /**
     * Send conversation object to both users
     */
    private void sendConversationToBothUsers(Long conversationId, Long userId1, Long userId2, String lastMessage, LocalDateTime lastMessageTime) {
        // Get conversation details from database
        Map<String, Object> conv1 = chatService.getConversationDetails(conversationId, userId1);
        Map<String, Object> conv2 = chatService.getConversationDetails(conversationId, userId2);
        
        if (conv1 == null || conv2 == null) return;
        
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
        
        System.out.println("Sent conversation " + conversationId + " to both users");
    }

    /**
     * Get conversations list for a user
     */
    @MessageMapping("/chat.conversations")
    public void getConversations(@Payload Map<String, Object> request, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = Long.parseLong(request.get("userId").toString());
        
        System.out.println("Getting conversations for user: " + userId);
        
        // Get conversations from database
        List<Map<String, Object>> userConversationsList = chatService.getUserConversations(userId);
        
        System.out.println("Found " + userConversationsList.size() + " conversations for user " + userId);
        
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
        
        // Fetch message history from database
        List<ChatMessageDTO> messages = chatService.getMessageHistory(conversationId);
        
        System.out.println("Found " + messages.size() + " messages for conversation " + conversationId);
        
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
        
        // Get conversation details
        Map<String, Object> conversationData = chatService.getConversationDetails(conversation.getId(), userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "CONVERSATION_STARTED");
        response.put("conversation", conversationData);

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/messages",
            response
        );
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
