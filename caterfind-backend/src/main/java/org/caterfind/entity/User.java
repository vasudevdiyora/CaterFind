package org.caterfind.entity;

import java.time.LocalDateTime;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.persistence.Table;

/**
 * User entity representing both CATERER and CLIENT roles.
 * 
 * IMPORTANT: Client role exists for authentication testing only.
 * Clients can login but have NO dashboard or features (intentionally excluded).
 * 
 * Only CATERER role has full access to the system.
 * 
 * NOTE: Passwords are stored in plain text for college project demo.
 * In production, use BCrypt hashing via Spring Security.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Plain text for demo - use BCrypt in production

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Optional client profile fields (stored on User for simplicity)
    @Column(length = 100)
    private String name;

    @Column(length = 50)
    private String city;

    @Column(length = 50)
    private String state;

    @Column(length = 100)
    private String area;

    @Column(length = 20)
    private String phone;

    // One-to-one relationship with CateringProfile (only for CATERER role)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CateringProfile cateringProfile;

    /**
     * Enum for user roles.
     * ADMIN: Full access to admin panel for platform management
     * CATERER: Full access to dashboard and all features
     * CLIENT: Login only, no dashboard (not implemented in this phase)
     */
    public enum UserRole {
        ADMIN,
        CATERER,
        CLIENT
    }

    // Automatically set createdAt timestamp before persisting
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public User() {
    }

    public User(String email, String password, UserRole role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public CateringProfile getCateringProfile() {
        return cateringProfile;
    }

    public void setCateringProfile(CateringProfile cateringProfile) {
        this.cateringProfile = cateringProfile;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    /**
     * Get display name for user.
     * For CATERER: returns business name from profile (or email if no profile)
     * For CLIENT: returns name if available, otherwise email
     */
    public String getDisplayName() {
        if (this.role == UserRole.CATERER && this.cateringProfile != null) {
            return this.cateringProfile.getBusinessName();
        }
        if (this.role == UserRole.CLIENT && this.name != null && !this.name.trim().isEmpty()) {
            return this.name;
        }
        return this.email; // Fallback to email
    }
}
