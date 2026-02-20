package org.caterfind.dto;

import java.time.LocalDate;

/**
 * Availability Status DTO
 */
public class AvailabilityStatusDTO {

    private Long id;
    private Long userId;
    private LocalDate date;
    private String status;

    public AvailabilityStatusDTO() {
    }

    public AvailabilityStatusDTO(Long id, Long userId, LocalDate date, String status) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.status = status;
    }

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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
