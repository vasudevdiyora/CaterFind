package org.caterfind.dto;

/**
 * DTO for login request.
 * 
 * Contains user credentials for authentication.
 */
public class LoginRequest {

    private String email;
    private String password;
    private String requestedRole;

    // Constructors
    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public LoginRequest(String email, String password, String requestedRole) {
        this.email = email;
        this.password = password;
        this.requestedRole = requestedRole;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRequestedRole() {
        return requestedRole;
    }

    public void setRequestedRole(String requestedRole) {
        this.requestedRole = requestedRole;
    }
}
