package org.caterfind.repository;

import org.caterfind.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Contact entity.
 * 
 * Provides database access methods for contact management.
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    /**
     * Find all contacts belonging to a specific caterer.
     * Used in Contact Management screen to display caterer's contacts.
     * 
     * @param catererId User ID of the caterer
     * @return List of contacts owned by the caterer
     */
    List<Contact> findByCatererId(Long catererId);

    /**
     * Count total contacts for a caterer.
     * Used for dashboard summary widget.
     * 
     * @param catererId User ID of the caterer
     * @return Total number of contacts
     */
    long countByCatererId(Long catererId);
}
