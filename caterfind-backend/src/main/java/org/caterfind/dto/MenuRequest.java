package org.caterfind.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for creating or updating a menu.
 */
public class MenuRequest {
    private String clientName;
    private String eventType;
    private String mealTime;
    private String eventLocation;
    private LocalDate eventDate;
    private Integer numberOfGuests;
    private String contactNumber;
    private String clientEmail;
    private List<MenuDishRequest> dishes;

    // Inner class for dish requests
    public static class MenuDishRequest {
        private Long dishId;
        private String menuCategory; // e.g., "Main Course", "Starter", "Dessert"
        private Integer displayOrder;
        private String note;

        // Getters and Setters
        public Long getDishId() {
            return dishId;
        }

        public void setDishId(Long dishId) {
            this.dishId = dishId;
        }

        public String getMenuCategory() {
            return menuCategory;
        }

        public void setMenuCategory(String menuCategory) {
            this.menuCategory = menuCategory;
        }

        public Integer getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(Integer displayOrder) {
            this.displayOrder = displayOrder;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }

    // Constructors
    public MenuRequest() {
    }

    // Getters and Setters
    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
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

    public List<MenuDishRequest> getDishes() {
        return dishes;
    }

    public void setDishes(List<MenuDishRequest> dishes) {
        this.dishes = dishes;
    }
}
