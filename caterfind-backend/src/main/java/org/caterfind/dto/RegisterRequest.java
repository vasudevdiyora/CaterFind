package org.caterfind.dto;

public class RegisterRequest {
    private String email;
    private String password;
    private String businessName;
    private String role; // "CATERER" or "CLIENT"
    // Caterer-specific fields
    private String ownerName;
    private String aadharNumber;
    private String panNumber;
    private String profileImageUrl;
    private String panDocumentUrl;
    private String aadharDocumentUrl;
    private String primaryPhone;
    private String alternatePhone;
    private String streetAddress;
    private String area;
    private String state;
    private String city;
    private String address;
    private String pincode;
    private Double latitude;
    private Double longitude;

    // Client-specific fields
    private String name;
    private String phone;

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

    // Getters and setters for new fields
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getPanDocumentUrl() { return panDocumentUrl; }
    public void setPanDocumentUrl(String panDocumentUrl) { this.panDocumentUrl = panDocumentUrl; }

    public String getAadharDocumentUrl() { return aadharDocumentUrl; }
    public void setAadharDocumentUrl(String aadharDocumentUrl) { this.aadharDocumentUrl = aadharDocumentUrl; }

    public String getPrimaryPhone() { return primaryPhone; }
    public void setPrimaryPhone(String primaryPhone) { this.primaryPhone = primaryPhone; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

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
