package org.caterfind.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.entity.PasswordResetOtp;
import org.caterfind.entity.User;
import org.caterfind.repository.PasswordResetOtpRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authentication service for user login.
 * 
 * Authentication service with:
 * - BCrypt password hashing
 * - JWT token generation
 * - Forgot-password OTP via email
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

     @Autowired
     private PasswordResetOtpRepository passwordResetOtpRepository;

     @Autowired
     private PasswordEncoder passwordEncoder;

     @Autowired
     private JwtService jwtService;

     @Autowired
     private EmailService emailService;

     @Value("${security.otp.expiration-minutes:10}")
     private int otpExpirationMinutes;

     @Value("${security.otp.max-attempts:5}")
     private int otpMaxAttempts;

     @Value("${security.otp.pepper:default-otp-pepper-change-in-production}")
     private String otpPepper;

     private static final SecureRandom OTP_RANDOM = new SecureRandom();

     @Autowired
     private org.caterfind.repository.CateringProfileRepository cateringProfileRepository;

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
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return LoginResponse.failure("Invalid email or password");
        }

        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());

        if (userOpt.isEmpty()) {
            return LoginResponse.failure("Invalid email or password");
        }

        User user = userOpt.get();

        if (user.getAccountStatus() == User.AccountStatus.SUSPENDED) {
            return LoginResponse.failure("Your account is suspended. Contact support.");
        }

        if (!isPasswordValid(user, request.getPassword())) {
            return LoginResponse.failure("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.success(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                token,
                jwtService.getExpirationSeconds());
    }

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
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return LoginResponse.failure("Email is required");
        }

        // Check if email already exists
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return LoginResponse.failure("Email already registered");
        }

        if (!isStrongPassword(request.getPassword())) {
            return LoginResponse.failure("Password must be at least 8 characters and include upper, lower, number, and special character");
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
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setAccountStatus(role == User.UserRole.CATERER ? User.AccountStatus.PENDING : User.AccountStatus.ACTIVE);

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
            profile.setEmail(normalizedEmail);
            profile.setStreetAddress(request.getStreetAddress());
            profile.setState(request.getState());
            profile.setArea(request.getArea());
            profile.setCity(request.getCity());
            profile.setLatitude(request.getLatitude());
            profile.setLongitude(request.getLongitude());
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

        String token = jwtService.generateToken(savedUser);

        return LoginResponse.success(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                token,
                jwtService.getExpirationSeconds());
    }

    public String requestPasswordResetOtp(String email) {
        String genericResponse = "If the email exists, an OTP has been sent.";
        if (email == null || email.isBlank()) {
            return genericResponse;
        }

        String normalizedEmail = email.trim().toLowerCase();
        passwordResetOtpRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return genericResponse;
        }

        String otp = generateOtp();
        PasswordResetOtp resetOtp = new PasswordResetOtp();
        resetOtp.setEmail(normalizedEmail);
        resetOtp.setOtpHash(hashOtp(normalizedEmail, otp));
        resetOtp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
        resetOtp.setUsed(false);
        resetOtp.setAttempts(0);

        passwordResetOtpRepository.save(resetOtp);

        String subject = "CaterFind Password Reset OTP";
        String body = "Your password reset OTP is: " + otp + "\n\n"
                + "This OTP will expire in " + otpExpirationMinutes + " minutes.\n"
                + "If you did not request this, please ignore this email.";
        emailService.sendEmail(normalizedEmail, subject, body);

        return genericResponse;
    }

    public boolean verifyPasswordResetOtp(String email, String otp) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank() || otp == null || otp.isBlank()) {
            return false;
        }

        Optional<PasswordResetOtp> otpOpt = passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
        return otpOpt.map(record -> validateOtpRecord(record, otp, false)).orElse(false);
    }

    public boolean resetPasswordWithOtp(String email, String otp, String newPassword) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank() || otp == null || otp.isBlank()) {
            return false;
        }
        if (!isStrongPassword(newPassword)) {
            throw new RuntimeException("Password must be at least 8 characters and include upper, lower, number, and special character");
        }

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return false;
        }

        Optional<PasswordResetOtp> otpOpt = passwordResetOtpRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);
        if (otpOpt.isEmpty()) {
            return false;
        }

        PasswordResetOtp record = otpOpt.get();
        boolean valid = validateOtpRecord(record, otp, true);
        if (!valid) {
            return false;
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    private boolean validateOtpRecord(PasswordResetOtp record, String otp, boolean consume) {
        if (record.isUsed() || record.isExpired() || record.getAttempts() >= otpMaxAttempts) {
            return false;
        }

        String incomingHash = hashOtp(record.getEmail(), otp);
        if (!incomingHash.equals(record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            passwordResetOtpRepository.save(record);
            return false;
        }

        record.setVerifiedAt(LocalDateTime.now());
        if (consume) {
            record.setUsed(true);
        }
        passwordResetOtpRepository.save(record);
        return true;
    }

    private String generateOtp() {
        int value = 100000 + OTP_RANDOM.nextInt(900000);
        return String.valueOf(value);
    }

    private String hashOtp(String email, String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String data = email + ":" + otp + ":" + otpPepper;
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to hash OTP", ex);
        }
    }

    private boolean isStrongPassword(String password) {
        if (password == null) {
            return false;
        }
        if (password.length() < 8) {
            return false;
        }
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");
    }

    private boolean isPasswordValid(User user, String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return false;
        }

        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }

        // Legacy migration path: if old plain-text password matches, upgrade to BCrypt.
        if (storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }
}
