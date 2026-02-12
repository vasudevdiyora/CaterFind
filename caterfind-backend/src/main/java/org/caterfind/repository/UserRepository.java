package org.caterfind.repository;

import org.caterfind.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity.
 * 
 * Provides database access methods for user authentication and management.
 * 
 * Spring Data JPA automatically implements this interface at runtime.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email address.
     * Used for login authentication.
     * 
     * @param email User's email address
     * @return Optional containing User if found, empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if email already exists.
     * Used for registration validation (if implemented in future).
     * 
     * @param email Email to check
     * @return true if email exists, false otherwise
     */
    boolean existsByEmail(String email);
}
