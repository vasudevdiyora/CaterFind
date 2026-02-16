package org.caterfind.controller;

import org.caterfind.dto.LoginRequest;
import org.caterfind.dto.LoginResponse;
import org.caterfind.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
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
}
