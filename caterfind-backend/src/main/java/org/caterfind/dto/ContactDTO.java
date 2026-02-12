package org.caterfind.dto;

import java.util.List;

/**
 * DTO for Contact entity.
 * 
 * Used for API requests and responses in Contact Management.
 * Includes label names as strings for easier frontend handling.
 */
public class ContactDTO {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String preferredContactMethod; // "EMAIL" or "SMS"
    private List<String> labels; // e.g., ["Staff", "Chef"]

    // Constructors
    public ContactDTO() {
    }

    public ContactDTO(Long id, String name, String phone, String email,
            String preferredContactMethod, List<String> labels) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.preferredContactMethod = preferredContactMethod;
        this.labels = labels;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPreferredContactMethod() {
        return preferredContactMethod;
    }

    public void setPreferredContactMethod(String preferredContactMethod) {
        this.preferredContactMethod = preferredContactMethod;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }
}
