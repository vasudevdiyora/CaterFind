package org.caterfind.repository;

import org.caterfind.entity.CateringProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for CateringProfile entity.
 * 
 * Provides database access methods for caterer business profiles.
 */
@Repository
public interface CateringProfileRepository extends JpaRepository<CateringProfile, Long> {

    /**
     * Find catering profile by user ID.
     * Used to fetch business details for "My Business" page.
     * 
     * @param userId User ID of the caterer
     * @return Optional containing CateringProfile if found, empty otherwise
     */
    Optional<CateringProfile> findByUserId(Long userId);
}
