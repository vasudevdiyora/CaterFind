package org.caterfind.service;

import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Authentication service for user login.
 * 
 * NOTE: This is a simple authentication for college project.
 * NO JWT tokens, NO Spring Security (to keep it simple).
 * Just plain password matching.
 * 
 * In production, use:
 * - BCrypt password hashing
 * - Spring Security
 * - JWT tokens for stateless authentication
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Authenticate user with email and password.
     * 
     * Returns role-based response:
     * - CATERER: Success, frontend redirects to dashboard
     * - CLIENT: Success, but frontend shows "not implemented" message
     * 
     * @param request Login credentials
     * @return LoginResponse with user info and role
     */
    public LoginResponse login(LoginRequest request) {
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return LoginResponse.failure("Invalid email or password");
        }

        User user = userOpt.get();

        // Check password (plain text comparison for demo)
        // In production, use BCrypt: passwordEncoder.matches(request.getPassword(),
        // user.getPassword())
        if (!user.getPassword().equals(request.getPassword())) {
            return LoginResponse.failure("Invalid email or password");
        }

        // Login successful - return user info with role
        return LoginResponse.success(
                user.getId(),
                user.getEmail(),
                user.getRole().name() // "CATERER" or "CLIENT"
        );
    }

    @Autowired
    private org.caterfind.repository.CateringProfileRepository cateringProfileRepository;

    /**
     * Register a new caterer.
     * 
     * Creates a new User with CATERER role.
     * Creates an initial CateringProfile with the provided business name.
     * 
     * @param request Registration details
     * @return LoginResponse with user info and role
     */
    public LoginResponse register(org.caterfind.dto.RegisterRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return LoginResponse.failure("Email already registered");
        }

        // Create new User
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Plain text for demo
        user.setRole(User.UserRole.CATERER);

        User savedUser = userRepository.save(user);

        // Create initial CateringProfile
        org.caterfind.entity.CateringProfile profile = new org.caterfind.entity.CateringProfile();
        profile.setUser(savedUser);
        profile.setBusinessName(request.getBusinessName());
        // Set defaults
        profile.setServiceRadius(50);

        cateringProfileRepository.save(profile);

        // Return success response (auto-login)
        return LoginResponse.success(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name());
    }
}
