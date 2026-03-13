package org.caterfind.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String businessName;
    private String role; // "CATERER" or "CLIENT"

    // Constructors
    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String businessName) {
        this.email = email;
        this.password = password;
        this.businessName = businessName;
        this.role = "CATERER"; // Default to CATERER for backward compatibility
    }

    public RegisterRequest(String email, String password, String businessName, String role) {
        this.email = email;
        this.password = password;
        this.businessName = businessName;
        this.role = role;
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

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
