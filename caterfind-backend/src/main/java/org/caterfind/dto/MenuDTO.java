package org.caterfind.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.caterfind.entity.Menu;

/**
 * DTO for Menu responses.
 */
public class MenuDTO {
    private Long id;
    private Long catererId;
    private String clientName;
    private String eventType;
    private String mealTime;
    private String eventLocation;
    private LocalDate eventDate;
    private Integer numberOfGuests;
    private String contactNumber;
    private String clientEmail;
    private String status;
    private Map<String, List<MenuDishDTO>> dishesByCategory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime sentAt;

    // Constructors
    public MenuDTO() {
    }

    public MenuDTO(Menu menu) {
        this.id = menu.getId();
        this.catererId = menu.getCaterer().getId();
        this.clientName = menu.getClientName();
        this.eventType = menu.getEventType();
        this.mealTime = menu.getMealTime();
        this.eventLocation = menu.getEventLocation();
        this.eventDate = menu.getEventDate();
        this.numberOfGuests = menu.getNumberOfGuests();
        this.contactNumber = menu.getContactNumber();
        this.clientEmail = menu.getClientEmail();
        this.status = menu.getStatus().name();
        this.createdAt = menu.getCreatedAt();
        this.updatedAt = menu.getUpdatedAt();
        this.sentAt = menu.getSentAt();
        
        // Group dishes by category
        this.dishesByCategory = menu.getDishes().stream()
                .collect(Collectors.groupingBy(
                        menuDish -> menuDish.getMenuCategory(),
                        Collectors.mapping(MenuDishDTO::new, Collectors.toList())
                ));
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

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getMealTime() {
        return mealTime;
    }

    public void setMealTime(String mealTime) {
        this.mealTime = mealTime;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public Integer getNumberOfGuests() {
        return numberOfGuests;
    }

    public void setNumberOfGuests(Integer numberOfGuests) {
        this.numberOfGuests = numberOfGuests;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getClientEmail() {
        return clientEmail;
    }

    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, List<MenuDishDTO>> getDishesByCategory() {
        return dishesByCategory;
    }

    public void setDishesByCategory(Map<String, List<MenuDishDTO>> dishesByCategory) {
        this.dishesByCategory = dishesByCategory;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
}
