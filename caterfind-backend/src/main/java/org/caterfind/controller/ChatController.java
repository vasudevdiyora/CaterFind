package org.caterfind.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.caterfind.dto.ChatMessageDTO;
import org.caterfind.entity.CateringProfile;
import org.caterfind.entity.User;
import org.caterfind.repository.CateringProfileRepository;
import org.caterfind.repository.UserRepository;
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
    private UserRepository userRepository;
    
    @Autowired
    private CateringProfileRepository cateringProfileRepository;

    // TODO: Replace with actual service layer
    // Mock storage for demonstration
    private static final Map<Long, List<ChatMessageDTO>> conversationMessages = new HashMap<>();
    private static final Map<Long, Set<Long>> userConversations = new HashMap<>();
    private static final Map<Long, Map<String, Object>> conversations = new HashMap<>();
    private static final Map<String, Long> userPairToConversation = new HashMap<>();

    /**
     * Get display name for a user
     * For caterers: returns business name from CateringProfile
     * For clients: returns email
     */
    private String getUserDisplayName(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return "User " + userId;
            }
            
            // If user is a caterer, get business name
            if (user.getRole() == User.UserRole.CATERER) {
                CateringProfile profile = cateringProfileRepository.findByUserId(userId).orElse(null);
                if (profile != null && profile.getBusinessName() != null) {
                    return profile.getBusinessName();
                }
            }
            
            // For clients or if no profile found, use email
            return user.getEmail();
        } catch (Exception e) {
            System.err.println("Error fetching user display name: " + e.getMessage());
            return "User " + userId;
        }
    }

    /**
     * Get or create a conversation between two users
     */
    private Long getOrCreateConversation(Long userId1, Long userId2, String user1Name, String user2Name, String user1Role, String user2Role) {
        String key = userId1 < userId2 ? userId1 + "_" + userId2 : userId2 + "_" + userId1;
        
        Long conversationId = userPairToConversation.get(key);
        
        if (conversationId == null) {
            conversationId = System.currentTimeMillis();
            userPairToConversation.put(key, conversationId);
            
            // Store conversation metadata
            Map<String, Object> conversation = new HashMap<>();
            conversation.put("id", conversationId);
            conversation.put("user1Id", userId1);
            conversation.put("user2Id", userId2);
            conversation.put("user1Name", user1Name);
            conversation.put("user2Name", user2Name);
            conversation.put("user1Role", user1Role);
            conversation.put("user2Role", user2Role);
            conversation.put("createdAt", LocalDateTime.now());
            conversations.put(conversationId, conversation);
            
            System.out.println("Created new conversation: " + conversationId + " between " + userId1 + " and " + userId2);
        }
        
        return conversationId;
    }

    /**
     * Handle incoming chat messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO message, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("Received message from " + message.getSenderId() + " to " + message.getRecipientId());
        
        // Set timestamp
        message.setTimestamp(LocalDateTime.now());
        message.setStatus("sent");

        // Determine actual conversation ID
        Long actualConversationId = message.getConversationId();
        
        // If conversationId is the same as recipientId, this is likely a temp conversation
        // We need to get or create the real conversation
        if (actualConversationId != null && actualConversationId.equals(message.getRecipientId())) {
            // This is a temporary conversation, create real one with actual names
            String senderName = getUserDisplayName(message.getSenderId());
            String recipientName = getUserDisplayName(message.getRecipientId());
            
            actualConversationId = getOrCreateConversation(
                message.getSenderId(),
                message.getRecipientId(),
                senderName,
                recipientName,
                "ROLE",
                "ROLE"
            );
            
            // Send conversation object to both users with the message
            sendConversationToBothUsers(actualConversationId, message.getSenderId(), message.getRecipientId(), message.getText(), message.getTimestamp());
        }

        // Store message with actual conversation ID
        message.setConversationId(actualConversationId);
        conversationMessages.computeIfAbsent(actualConversationId, k -> new ArrayList<>()).add(message);

        // Send to recipient
        ChatMessageDTO newMessage = new ChatMessageDTO("NEW_MESSAGE");
        newMessage.setConversationId(actualConversationId);
        newMessage.setText(message.getText());
        newMessage.setSenderId(message.getSenderId());
        newMessage.setTimestamp(message.getTimestamp());
        newMessage.setStatus("sent");

        System.out.println("Sending message to user: " + message.getRecipientId() + " with conversation: " + actualConversationId);
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
            message.getRecipientId().toString(),
            "/queue/messages",
            newMessage
        );

        // Send confirmation back to sender
        ChatMessageDTO confirmation = new ChatMessageDTO("MESSAGE_SENT");
        confirmation.setId(message.getId());
        confirmation.setConversationId(actualConversationId);
        messagingTemplate.convertAndSendToUser(
            message.getSenderId().toString(),
            "/queue/messages",
            confirmation
        );
        
        System.out.println("Message sent successfully");
    }
    
    /**
     * Send conversation object to both users
     */
    private void sendConversationToBothUsers(Long conversationId, Long userId1, Long userId2, String lastMessage, LocalDateTime lastMessageTime) {
        Map<String, Object> convData = conversations.get(conversationId);
        if (convData == null) return;
        
        // Send to user1
        Map<String, Object> conv1 = new HashMap<>();
        conv1.put("id", conversationId);
        conv1.put("participantId", userId2);
        conv1.put("participantName", convData.get("user2Name"));
        conv1.put("participantRole", convData.get("user2Role"));
        conv1.put("lastMessage", lastMessage);
        conv1.put("lastMessageTime", lastMessageTime);
        conv1.put("unreadCount", 0);
        
        Map<String, Object> response1 = new HashMap<>();
        response1.put("type", "CONVERSATION_STARTED");
        response1.put("conversation", conv1);
        
        messagingTemplate.convertAndSendToUser(
            userId1.toString(),
            "/queue/messages",
            response1
        );
        
        // Send to user2
        Map<String, Object> conv2 = new HashMap<>();
        conv2.put("id", conversationId);
        conv2.put("participantId", userId1);
        conv2.put("participantName", convData.get("user1Name"));
        conv2.put("participantRole", convData.get("user1Role"));
        conv2.put("lastMessage", lastMessage);
        conv2.put("lastMessageTime", lastMessageTime);
        conv2.put("unreadCount", 0);
        
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
        
        // Find all conversations involving this user
        List<Map<String, Object>> userConversationsList = new ArrayList<>();
        
        for (Map.Entry<Long, Map<String, Object>> entry : conversations.entrySet()) {
            Long convId = entry.getKey();
            Map<String, Object> convData = entry.getValue();
            
            Long user1Id = (Long) convData.get("user1Id");
            Long user2Id = (Long) convData.get("user2Id");
            
            // Check if this conversation involves the requesting user
            if (userId.equals(user1Id) || userId.equals(user2Id)) {
                // Determine the other participant
                Long participantId = userId.equals(user1Id) ? user2Id : user1Id;
                String participantName = userId.equals(user1Id) ? 
                    (String) convData.get("user2Name") : (String) convData.get("user1Name");
                String participantRole = userId.equals(user1Id) ? 
                    (String) convData.get("user2Role") : (String) convData.get("user1Role");
                
                // Get last message for this conversation
                List<ChatMessageDTO> messages = conversationMessages.get(convId);
                String lastMessage = null;
                LocalDateTime lastMessageTime = (LocalDateTime) convData.get("createdAt");
                
                if (messages != null && !messages.isEmpty()) {
                    ChatMessageDTO lastMsg = messages.get(messages.size() - 1);
                    lastMessage = lastMsg.getText();
                    lastMessageTime = lastMsg.getTimestamp();
                }
                
                Map<String, Object> conv = new HashMap<>();
                conv.put("id", convId);
                conv.put("participantId", participantId);
                conv.put("participantName", participantName);
                conv.put("participantRole", participantRole);
                conv.put("lastMessage", lastMessage);
                conv.put("lastMessageTime", lastMessageTime);
                conv.put("unreadCount", 0);
                
                userConversationsList.add(conv);
            }
        }
        
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
        
        // TODO: Fetch from database
        List<ChatMessageDTO> messages = conversationMessages.getOrDefault(conversationId, new ArrayList<>());
        
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
        String recipientName = request.get("recipientName").toString();
        String recipientRole = request.get("recipientRole").toString();
        
        // TODO: Create conversation in database
        // For now, generate a conversation ID
        Long conversationId = System.currentTimeMillis();
        
        userConversations.computeIfAbsent(userId, k -> new HashSet<>()).add(conversationId);
        userConversations.computeIfAbsent(recipientId, k -> new HashSet<>()).add(conversationId);
        
        Map<String, Object> conversation = new HashMap<>();
        conversation.put("id", conversationId);
        conversation.put("participantId", recipientId);
        conversation.put("participantName", recipientName);
        conversation.put("participantRole", recipientRole);
        conversation.put("lastMessage", null);
        conversation.put("lastMessageTime", LocalDateTime.now());
        conversation.put("unreadCount", 0);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "CONVERSATION_STARTED");
        response.put("conversation", conversation);

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
