package org.caterfind.entity;

import javax.persistence.*;

/**
 * ContactLabel entity for categorizing contacts.
 * 
 * Predefined labels: Staff, Chef, Helper, Supplier, Dealer
 * 
 * Labels are flexible to support real catering workflow where:
 * - A person can be both "Chef" and "Staff"
 * - A supplier can also be a dealer
 * 
 * Many-to-many relationship with Contact via ContactLabelMapping.
 */
@Entity
@Table(name = "contact_labels")
public class ContactLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "label_name", nullable = false, unique = true, length = 50)
    private String labelName;

    // Constructors
    public ContactLabel() {
    }

    public ContactLabel(String labelName) {
        this.labelName = labelName;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLabelName() {
        return labelName;
    }

    public void setLabelName(String labelName) {
        this.labelName = labelName;
    }
}
