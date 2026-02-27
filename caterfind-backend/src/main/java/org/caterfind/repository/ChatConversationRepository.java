package org.caterfind.repository;

import org.caterfind.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ChatConversation entity.
 * 
 * Provides database access methods for chat conversations.
 */
@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    /**
     * Find all conversations involving a specific user.
     * User can be either participant1 or participant2.
     * 
     * @param userId User ID
     * @return List of conversations
     */
    @Query("SELECT c FROM ChatConversation c WHERE c.participant1Id = :userId OR c.participant2Id = :userId ORDER BY c.lastMessageAt DESC")
    List<ChatConversation> findByUserId(@Param("userId") Long userId);

    /**
     * Find a conversation between two users.
     * Order doesn't matter (can be participant1-participant2 or participant2-participant1).
     * 
     * @param userId1 First user ID
     * @param userId2 Second user ID
     * @return Optional conversation
     */
    @Query("SELECT c FROM ChatConversation c WHERE " +
           "(c.participant1Id = :userId1 AND c.participant2Id = :userId2) OR " +
           "(c.participant1Id = :userId2 AND c.participant2Id = :userId1)")
    Optional<ChatConversation> findByParticipants(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
