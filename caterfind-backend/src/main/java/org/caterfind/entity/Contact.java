package org.caterfind.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Contact entity for managing caterer's contacts.
 * 
 * Contacts can be: Staff, Chef, Helper, Supplier, Dealer (via labels).
 * 
 * preferred_contact_method determines whether to use EMAIL or SMS
 * when sending broadcast messages from the messaging module.
 * 
 * IMPORTANT: This is NOT for client event contacts.
 * This is purely for internal caterer coordination (staff, suppliers, etc.).
 */
@Entity
@Table(name = "contacts")
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Foreign key to User (caterer who owns this contact)
    @Column(name = "caterer_id", nullable = false)
    private Long catererId;

    @Column(nullable = false)
    private String name;

    @Column(length = 20)
    private String phone;

    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_contact_method")
    private ContactMethod preferredContactMethod = ContactMethod.EMAIL;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Many-to-many relationship with ContactLabel
    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(name = "contact_label_mapping", joinColumns = @JoinColumn(name = "contact_id"), inverseJoinColumns = @JoinColumn(name = "label_id"))
    private Set<ContactLabel> labels = new HashSet<>();

    /**
     * Enum for preferred contact method.
     * Determines whether to use EmailService or SmsService for messaging.
     */
    public enum ContactMethod {
        EMAIL,
        SMS,
        CALL
    }

    // Automatically set createdAt timestamp before persisting
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Contact() {
    }

    public Contact(Long catererId, String name, String phone, String email, ContactMethod preferredContactMethod) {
        this.catererId = catererId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.preferredContactMethod = preferredContactMethod;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCatererId() {
        return catererId;
    }

    public void setCatererId(Long catererId) {
        this.catererId = catererId;
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

    public ContactMethod getPreferredContactMethod() {
        return preferredContactMethod;
    }

    public void setPreferredContactMethod(ContactMethod preferredContactMethod) {
        this.preferredContactMethod = preferredContactMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<ContactLabel> getLabels() {
        return labels;
    }

    public void setLabels(Set<ContactLabel> labels) {
        this.labels = labels;
    }
}
