package org.caterfind.repository;

import org.caterfind.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ChatMessage entity.
 * 
 * Provides database access methods for chat messages.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Find all messages in a conversation.
     * Ordered by creation time (oldest first).
     * 
     * @param conversationId Conversation ID
     * @return List of messages
     */
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    /**
     * Find messages in a conversation created after the specified timestamp.
     * Ordered by creation time (oldest first).
     */
    List<ChatMessage> findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(Long conversationId, java.time.LocalDateTime createdAt);

    /**
     * Count messages in a conversation.
     * 
     * @param conversationId Conversation ID
     * @return Number of messages
     */
    long countByConversationId(Long conversationId);
}
