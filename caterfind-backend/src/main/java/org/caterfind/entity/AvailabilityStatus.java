package org.caterfind.entity;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * Availability Status Entity
 * 
 * Stores availability (available/busy) for each caterer per date.
 */
@Entity
@Table(name = "availability_status", indexes = {
    @Index(name = "idx_availability_user_date", columnList = "user_id, available_date"),
    @Index(name = "idx_availability_date", columnList = "available_date")
})
public class AvailabilityStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "available_date", nullable = false)
    private LocalDate availableDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // "available" or "busy"

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getAvailableDate() {
        return availableDate;
    }

    public void setAvailableDate(LocalDate availableDate) {
        this.availableDate = availableDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
