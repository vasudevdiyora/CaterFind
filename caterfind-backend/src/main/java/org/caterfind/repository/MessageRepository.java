package org.caterfind.repository;

import org.caterfind.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Message entity.
 * 
 * Provides database access methods for message audit logs.
 * 
 * REMINDER: This is NOT a chat system.
 * Messages are broadcast-only, no threading or replies.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Find all messages sent by a specific caterer.
     * Used for message history/logs page.
     * Ordered by sent date (newest first).
     * 
     * @param catererId User ID of the caterer
     * @return List of messages sent by the caterer
     */
    List<Message> findByCatererIdOrderBySentAtDesc(Long catererId);

    /**
     * Count total messages sent by a caterer.
     * Used for dashboard summary widget.
     * 
     * @param catererId User ID of the caterer
     * @return Total number of messages sent
     */
    long countByCatererId(Long catererId);
}
