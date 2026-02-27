package org.caterfind.service;

import org.caterfind.dto.ChatMessageDTO;
import org.caterfind.entity.ChatConversation;
import org.caterfind.entity.ChatMessage;
import org.caterfind.entity.CateringProfile;
import org.caterfind.entity.User;
import org.caterfind.repository.ChatConversationRepository;
import org.caterfind.repository.ChatMessageRepository;
import org.caterfind.repository.CateringProfileRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for handling chat operations with database persistence.
 */
@Service
public class ChatService {

    @Autowired
    private ChatConversationRepository conversationRepository;

    @Autowired
    private ChatMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CateringProfileRepository cateringProfileRepository;

    /**
     * Get display name for a user.
     * For caterers: returns business name from CateringProfile.
     * For clients: returns email.
     */
    public String getUserDisplayName(Long userId) {
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
     * Get user role.
     */
    public String getUserRole(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return "UNKNOWN";
            }
            return user.getRole().toString();
        } catch (Exception e) {
            System.err.println("Error fetching user role: " + e.getMessage());
            return "UNKNOWN";
        }
    }

    /**
     * Get or create a conversation between two users.
     */
    @Transactional
    public ChatConversation getOrCreateConversation(Long userId1, Long userId2) {
        // Check if conversation already exists
        Optional<ChatConversation> existing = conversationRepository.findByParticipants(userId1, userId2);
        
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create new conversation
        ChatConversation conversation = new ChatConversation(userId1, userId2);
        return conversationRepository.save(conversation);
    }

    /**
     * Save a message to the database.
     */
    @Transactional
    public ChatMessage saveMessage(Long conversationId, Long senderId, String text, String status) {
        ChatMessage message = new ChatMessage(conversationId, senderId, text, status);
        ChatMessage savedMessage = messageRepository.save(message);

        // Update conversation's last message time
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setLastMessageAt(savedMessage.getCreatedAt());
            conversationRepository.save(conv);
        });

        return savedMessage;
    }

    /**
     * Get all conversations for a user.
     */
    public List<Map<String, Object>> getUserConversations(Long userId) {
        List<ChatConversation> conversations = conversationRepository.findByUserId(userId);
        
        return conversations.stream().map(conv -> {
            // Determine the other participant
            Long participantId = userId.equals(conv.getParticipant1Id()) 
                ? conv.getParticipant2Id() 
                : conv.getParticipant1Id();
            
            String participantName = getUserDisplayName(participantId);
            String participantRole = getUserRole(participantId);

            // Get last message for this conversation
            List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
            String lastMessage = null;
            LocalDateTime lastMessageTime = conv.getCreatedAt();

            if (!messages.isEmpty()) {
                ChatMessage lastMsg = messages.get(messages.size() - 1);
                lastMessage = lastMsg.getText();
                lastMessageTime = lastMsg.getCreatedAt();
            }

            Map<String, Object> convMap = new HashMap<>();
            convMap.put("id", conv.getId());
            convMap.put("participantId", participantId);
            convMap.put("participantName", participantName);
            convMap.put("participantRole", participantRole);
            convMap.put("lastMessage", lastMessage);
            convMap.put("lastMessageTime", lastMessageTime);
            convMap.put("unreadCount", 0);

            return convMap;
        }).collect(Collectors.toList());
    }

    /**
     * Get message history for a conversation.
     */
    public List<ChatMessageDTO> getMessageHistory(Long conversationId) {
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        
        return messages.stream().map(msg -> {
            ChatMessageDTO dto = new ChatMessageDTO("NEW_MESSAGE");
            dto.setId(msg.getId());
            dto.setConversationId(msg.getConversationId());
            dto.setSenderId(msg.getSenderId());
            dto.setSenderName(getUserDisplayName(msg.getSenderId()));
            dto.setText(msg.getText());
            dto.setTimestamp(msg.getCreatedAt());
            dto.setStatus(msg.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Get conversation details with participant info.
     */
    public Map<String, Object> getConversationDetails(Long conversationId, Long requestingUserId) {
        Optional<ChatConversation> convOpt = conversationRepository.findById(conversationId);
        
        if (!convOpt.isPresent()) {
            return null;
        }

        ChatConversation conv = convOpt.get();
        
        // Determine the other participant
        Long participantId = requestingUserId.equals(conv.getParticipant1Id()) 
            ? conv.getParticipant2Id() 
            : conv.getParticipant1Id();
        
        String participantName = getUserDisplayName(participantId);
        String participantRole = getUserRole(participantId);

        // Get last message
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        String lastMessage = null;
        LocalDateTime lastMessageTime = conv.getCreatedAt();

        if (!messages.isEmpty()) {
            ChatMessage lastMsg = messages.get(messages.size() - 1);
            lastMessage = lastMsg.getText();
            lastMessageTime = lastMsg.getCreatedAt();
        }

        Map<String, Object> convMap = new HashMap<>();
        convMap.put("id", conv.getId());
        convMap.put("participantId", participantId);
        convMap.put("participantName", participantName);
        convMap.put("participantRole", participantRole);
        convMap.put("lastMessage", lastMessage);
        convMap.put("lastMessageTime", lastMessageTime);
        convMap.put("unreadCount", 0);

        return convMap;
    }
}
