package org.caterfind.repository;

import java.util.Optional;

import org.caterfind.entity.ContactLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for ContactLabel entity.
 * 
 * Provides database access methods for contact labels.
 */
@Repository
public interface ContactLabelRepository extends JpaRepository<ContactLabel, Long> {

    /**
     * Find label by name.
     * Used when assigning labels to contacts.
     * 
     * @param labelName Name of the label (e.g., "Staff", "Chef")
     * @return Optional containing ContactLabel if found, empty otherwise
     */
    Optional<ContactLabel> findByLabelName(String labelName);

    /**
     * Find label by name, case-insensitive.
     * Helps avoid production mismatches caused by data casing differences.
     *
     * @param labelName Name of the label
     * @return Optional containing ContactLabel if found, empty otherwise
     */
    Optional<ContactLabel> findByLabelNameIgnoreCase(String labelName);
}
