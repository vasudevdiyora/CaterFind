package org.caterfind.repository;

import java.util.Optional;

import org.caterfind.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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

    /**
     * Check if any user exists for a given role.
     * Used for startup admin seeding to avoid duplicate admin creation.
     *
     * @param role Role to check
     * @return true if at least one user with the role exists
     */
    boolean existsByRole(User.UserRole role);
}
