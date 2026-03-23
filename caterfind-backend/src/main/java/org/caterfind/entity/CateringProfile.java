package org.caterfind.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.persistence.Table;

/**
 * CateringProfile entity storing business information for caterers.
 * 
 * One-to-one relationship with User entity (only for CATERER role).
 * 
 * This profile is displayed in the "My Business" section of the dashboard.
 * 
 * NO client profiles exist (client features are out of scope).
 */
@Entity
@Table(name = "catering_profile")
public class CateringProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One-to-one relationship with User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "primary_phone", length = 20)
    private String primaryPhone;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    @Column(length = 100)
    private String email;

    @Column(name = "street_address")
    private String streetAddress;

    @Column(length = 100)
    private String area;

    @Column(length = 50)
    private String state;

    @Column(length = 50)
    private String city;

    @Column(length = 10)
    private String pincode;

    @Column(length = 100)
    private String landmark;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "service_radius")
    private Integer serviceRadius;

    @Column(name = "rating")
    private Double rating; // Average rating (e.g., 4.5)

    @Column(name = "image_url")
    private String imageUrl; // URL to profile image

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "aadhar_number", length = 50)
    private String aadharNumber;
    
    @Column(name = "pan_number", length = 50)
    private String panNumber;

    @Column(name = "pan_document_url", length = 255)
    private String panDocumentUrl;

    @Column(name = "aadhar_document_url", length = 255)
    private String aadharDocumentUrl;

    @Column(name = "business_photos", columnDefinition = "TEXT")
    private String businessPhotos; // Comma-separated URLs of business photos for gallery

    // Legacy address field - mapped to getFullAddress logic if needed or removed
    // For now replacing strict 'address' with granular fields.
    // Ensure database schema updates via Hibernate ddl-auto=update
    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Automatically set createdAt timestamp before persisting
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public CateringProfile() {
    }

    public CateringProfile(User user, String businessName, String primaryPhone, String streetAddress, String city) {
        this.user = user;
        this.businessName = businessName;
        this.primaryPhone = primaryPhone;
        this.streetAddress = streetAddress;
        this.city = city;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrimaryPhone() {
        return primaryPhone;
    }

    public void setPrimaryPhone(String primaryPhone) {
        this.primaryPhone = primaryPhone;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getLandmark() {
        return landmark;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getServiceRadius() {
        return serviceRadius;
    }

    public void setServiceRadius(Integer serviceRadius) {
        this.serviceRadius = serviceRadius;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getBusinessPhotos() {
        return businessPhotos;
    }

    public void setBusinessPhotos(String businessPhotos) {
        this.businessPhotos = businessPhotos;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getPanDocumentUrl() {
        return panDocumentUrl;
    }

    public void setPanDocumentUrl(String panDocumentUrl) {
        this.panDocumentUrl = panDocumentUrl;
    }

    public String getAadharDocumentUrl() {
        return aadharDocumentUrl;
    }

    public void setAadharDocumentUrl(String aadharDocumentUrl) {
        this.aadharDocumentUrl = aadharDocumentUrl;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
