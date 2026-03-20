package org.caterfind.dto;

/**
 * DTO for login response.
 * 
 * Contains user information and role-based redirect instructions.
 * 
 * Frontend uses this to determine:
 * - CATERER role → redirect to dashboard
 * - CLIENT role → show "not implemented" message
 */
public class LoginResponse {

    private Long userId;
    private String email;
    private String role; // "CATERER" or "CLIENT"
    private String message; // Success or error message
    private boolean success;
    private String token;
    private String tokenType;
    private Long expiresIn;

    // Constructors
    public LoginResponse() {
    }

    public LoginResponse(Long userId, String email, String role, String message, boolean success, String token, String tokenType, Long expiresIn) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.message = message;
        this.success = success;
        this.token = token;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
    }

    // Static factory methods for convenience
    public static LoginResponse success(Long userId, String email, String role, String token, long expiresIn) {
        return new LoginResponse(userId, email, role, "Login successful", true, token, "Bearer", expiresIn);
    }

    public static LoginResponse failure(String message) {
        return new LoginResponse(null, null, null, message, false, null, null, null);
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }
}
