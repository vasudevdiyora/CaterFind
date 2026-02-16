package org.caterfind.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String businessName;

    // Constructors
    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String businessName) {
        this.email = email;
        this.password = password;
        this.businessName = businessName;
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
}
