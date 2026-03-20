package org.caterfind.controller;

import java.util.Map;

import org.caterfind.dto.ForgotPasswordRequest;
import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.dto.ResetPasswordRequest;
import org.caterfind.dto.VerifyOtpRequest;
import org.caterfind.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for user login.
 * 
 * Endpoints:
 * - POST /auth/login - Authenticate user
 * 
 * Returns role-based response for frontend routing:
 * - CATERER → frontend redirects to dashboard
 * - CLIENT → frontend shows "not implemented" message
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // Allow frontend on different port (for development)
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Login endpoint.
     * 
     * Authenticates user and returns role information.
     * Frontend uses role to determine navigation:
     * - CATERER: redirect to /dashboard
     * - CLIENT: show "Client dashboard not implemented" message
     * 
     * @param request Login credentials (email, password)
     * @return LoginResponse with user info and role
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
     * 
     * Creates a new caterer account and logs them in.
     * 
     * @param request Registration details
     * @return LoginResponse
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
}
