package org.caterfind.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

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

    // One-to-one relationship with CateringProfile (only for CATERER role)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CateringProfile cateringProfile;

    /**
     * Enum for user roles.
     * CATERER: Full access to dashboard and all features
     * CLIENT: Login only, no dashboard (not implemented in this phase)
     */
    public enum UserRole {
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
}
