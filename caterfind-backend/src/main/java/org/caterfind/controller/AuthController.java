package org.caterfind.controller;

import java.util.Map;
import java.security.Principal;

import org.caterfind.dto.ForgotPasswordRequest;
import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.dto.ResetPasswordRequest;
import org.caterfind.dto.VerifyOtpRequest;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.caterfind.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for user login.
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Login endpoint.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * Register endpoint.
     */
    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody org.caterfind.dto.RegisterRequest request) {
        LoginResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update client profile (name, phone, location).
     * Authenticated endpoint — reads the current user from JWT principal.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (body.containsKey("name")) user.setName(body.get("name"));
            if (body.containsKey("phone")) user.setPhone(body.get("phone"));
            if (body.containsKey("location")) user.setCity(body.get("location"));

            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "name", user.getName() != null ? user.getName() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "city", user.getCity() != null ? user.getCity() : "",
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current user profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(Map.of(
                "name", user.getName() != null ? user.getName() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "city", user.getCity() != null ? user.getCity() : "",
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody ForgotPasswordRequest request) {
        String message = authService.requestPasswordResetOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", message));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        boolean valid = authService.verifyPasswordResetOtp(request.getEmail(), request.getOtp());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Invalid or expired OTP"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            boolean changed = authService.resetPasswordWithOtp(
                    request.getEmail(),
                    request.getOtp(),
                    request.getNewPassword());

            if (!changed) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "message", "Invalid request or OTP"));
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successful"));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        }
    }

    /**
     * Request an OTP to verify a new email before changing it.
     * Sends the OTP to the new email address.
     * Body: { "newEmail": "..." }
     */
    @PostMapping("/email-change/request-otp")
    public ResponseEntity<?> requestEmailChangeOtp(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            String newEmail = body.get("newEmail");
            String message = authService.requestEmailChangeOtp(principal.getName(), newEmail);
            return ResponseEntity.ok(Map.of("success", true, "message", message));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", ex.getMessage()));
        }
    }

    /**
     * Verify the OTP and apply the email change.
     * Body: { "newEmail": "...", "otp": "123456" }
     */
    @PostMapping("/email-change/verify-otp")
    public ResponseEntity<?> verifyEmailChangeOtp(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            String newEmail = body.get("newEmail");
            String otp = body.get("otp");
            authService.verifyEmailChangeOtp(principal.getName(), newEmail, otp);
            return ResponseEntity.ok(Map.of("success", true, "message", "Email updated successfully."));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", ex.getMessage()));
        }
    }
}
