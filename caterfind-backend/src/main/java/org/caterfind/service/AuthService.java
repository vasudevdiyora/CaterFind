package org.caterfind.service;

import java.util.Optional;

import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

        // Determine role (default to CATERER if not specified)
        String roleStr = request.getRole() != null ? request.getRole().toUpperCase() : "CATERER";
        User.UserRole role;
        try {
            role = User.UserRole.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            return LoginResponse.failure("Invalid role: " + roleStr);
        }

        // Validate numeric-only constraints and exact lengths for Aadhaar/phone
        if (role == User.UserRole.CATERER) {
            String aadhar = request.getAadharNumber();
            String primaryPhone = request.getPrimaryPhone();
            String alternatePhone = request.getAlternatePhone();
            if (aadhar != null && !aadhar.isBlank() && !aadhar.matches("^\\d+$")) {
                return LoginResponse.failure("Aadhar number must contain digits only");
            }
            if (aadhar != null && !aadhar.isBlank() && aadhar.length() != 12) {
                return LoginResponse.failure("Aadhar number must be exactly 12 digits");
            }
            if (primaryPhone != null && !primaryPhone.isBlank() && !primaryPhone.matches("^\\d+$")) {
                return LoginResponse.failure("Primary phone must contain digits only");
            }
            if (primaryPhone != null && !primaryPhone.isBlank() && primaryPhone.length() != 10) {
                return LoginResponse.failure("Primary phone must be exactly 10 digits");
            }
            if (alternatePhone != null && !alternatePhone.isBlank() && !alternatePhone.matches("^\\d+$")) {
                return LoginResponse.failure("Alternate phone must contain digits only");
            }
            if (alternatePhone != null && !alternatePhone.isBlank() && alternatePhone.length() != 10) {
                return LoginResponse.failure("Alternate phone must be exactly 10 digits");
            }
        }
        if (role == User.UserRole.CLIENT) {
            String clientPhone = request.getPhone();
            if (clientPhone != null && !clientPhone.isBlank() && !clientPhone.matches("^\\d+$")) {
                return LoginResponse.failure("Phone must contain digits only");
            }
            if (clientPhone != null && !clientPhone.isBlank() && clientPhone.length() != 10) {
                return LoginResponse.failure("Phone must be exactly 10 digits");
            }
        }

        // Create new User
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Plain text for demo
        user.setRole(role);

        User savedUser = userRepository.save(user);

        // Only create CateringProfile for CATERER role
        if (role == User.UserRole.CATERER) {
            org.caterfind.entity.CateringProfile profile = new org.caterfind.entity.CateringProfile();
            profile.setUser(savedUser);
            profile.setBusinessName(request.getBusinessName());
            profile.setOwnerName(request.getOwnerName());
            profile.setAadharNumber(request.getAadharNumber());
            profile.setPrimaryPhone(request.getPrimaryPhone());
            profile.setAlternatePhone(request.getAlternatePhone());
            profile.setEmail(request.getEmail());
            profile.setStreetAddress(request.getStreetAddress());
            profile.setState(request.getState());
            profile.setArea(request.getArea());
            profile.setCity(request.getCity());
            profile.setAddress(request.getAddress());
            // Set defaults
            profile.setServiceRadius(50);

            cateringProfileRepository.save(profile);
        }

        // Save client-specific profile data onto User (simple storage)
        if (role == User.UserRole.CLIENT) {
            if (request.getName() != null) savedUser.setName(request.getName());
            if (request.getPhone() != null) savedUser.setPhone(request.getPhone());
            if (request.getCity() != null) savedUser.setCity(request.getCity());
            if (request.getState() != null) savedUser.setState(request.getState());
            if (request.getArea() != null) savedUser.setArea(request.getArea());
            userRepository.save(savedUser);
        }

        // Return success response (auto-login)
        return LoginResponse.success(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name());
    }
}
