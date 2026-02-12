package org.caterfind.dto;

import java.math.BigDecimal;

/**
 * DTO for InventoryItem entity.
 * 
 * Used for API requests and responses in Inventory Management.
 */
public class InventoryDTO {

    private Long id;
    private String itemName;
    private String category; // "GRAIN", "VEGETABLE", etc.
    private BigDecimal quantity;
    private String unit; // kg, liters, pieces, etc.
    private BigDecimal minThreshold;
    private Long dealerContactId; // Optional: assigned dealer from contacts
    private String dealerName; // For display purposes or manual entry
    private String dealerPhone; // For display purposes or manual entry
    private Boolean isLowStock; // Computed: quantity < minThreshold

    // Constructors
    public InventoryDTO() {
    }

    public InventoryDTO(Long id, String itemName, String category, BigDecimal quantity,
            String unit, BigDecimal minThreshold, Long dealerContactId,
            String dealerName, String dealerPhone, Boolean isLowStock) {
        this.id = id;
        this.itemName = itemName;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minThreshold = minThreshold;
        this.dealerContactId = dealerContactId;
        this.dealerName = dealerName;
        this.dealerPhone = dealerPhone;
        this.isLowStock = isLowStock;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getMinThreshold() {
        return minThreshold;
    }

    public void setMinThreshold(BigDecimal minThreshold) {
        this.minThreshold = minThreshold;
    }

    public Long getDealerContactId() {
        return dealerContactId;
    }

    public void setDealerContactId(Long dealerContactId) {
        this.dealerContactId = dealerContactId;
    }

    public String getDealerName() {
        return dealerName;
    }

    public void setDealerName(String dealerName) {
        this.dealerName = dealerName;
    }

    public String getDealerPhone() {
        return dealerPhone;
    }

    public void setDealerPhone(String dealerPhone) {
        this.dealerPhone = dealerPhone;
    }

    public Boolean getIsLowStock() {
        return isLowStock;
    }

    public void setIsLowStock(Boolean isLowStock) {
        this.isLowStock = isLowStock;
    }
}
