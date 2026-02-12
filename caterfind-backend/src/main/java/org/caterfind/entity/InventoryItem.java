package org.caterfind.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * InventoryItem entity for tracking caterer's inventory.
 * 
 * Features:
 * - Categorized items (Grain, Vegetable, Meat, Dairy, Masala, Oil, Other)
 * - Quantity tracking with units (kg, liters, pieces, etc.)
 * - Minimum threshold for low-stock alerts
 * - Optional dealer assignment from contacts
 * 
 * Low stock detection:
 * - isLowStock is computed: TRUE when quantity < minThreshold
 * - Used for dashboard widget and low-stock alerts
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO billing or invoicing
 * - NO supplier ordering system
 * - NO purchase order flow
 * 
 * This is purely for internal inventory tracking.
 */
@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Foreign key to User (caterer who owns this inventory)
    @Column(name = "caterer_id", nullable = false)
    private Long catererId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(nullable = false, length = 50)
    private String unit; // e.g., kg, liters, pieces, dozen

    @Column(name = "min_threshold", nullable = false, precision = 10, scale = 2)
    private BigDecimal minThreshold = BigDecimal.ZERO;

    // Optional: Assigned dealer from contacts (for reordering)
    @Column(name = "dealer_contact_id")
    private Long dealerContactId;

    // Optional: Manual dealer details (if not linked to a contact)
    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "dealer_phone")
    private String dealerPhone;

    // Computed field: TRUE when quantity < minThreshold
    // Note: In MySQL, this would be a generated column
    // In JPA, we compute it in the getter for simplicity
    @Transient
    private Boolean isLowStock;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Enum for inventory item categories.
     * Matches common catering inventory types.
     */
    public enum ItemCategory {
        GRAIN,
        VEGETABLE,
        MEAT,
        DAIRY,
        MASALA,
        OIL,
        SAUCE,
        SWEET,
        ESSENTIALS,
        OTHER
    }

    // Automatically set timestamps
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public InventoryItem() {
    }

    public InventoryItem(Long catererId, String itemName, ItemCategory category,
            BigDecimal quantity, String unit, BigDecimal minThreshold) {
        this.catererId = catererId;
        this.itemName = itemName;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minThreshold = minThreshold;
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

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public ItemCategory getCategory() {
        return category;
    }

    public void setCategory(ItemCategory category) {
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

    /**
     * Computed property: Returns TRUE if quantity is below minimum threshold.
     * Used for low-stock alerts on dashboard.
     */
    public Boolean getIsLowStock() {
        return quantity.compareTo(minThreshold) <= 0;
    }

    public void setIsLowStock(Boolean isLowStock) {
        // Setter for JPA compatibility, but value is computed
        this.isLowStock = isLowStock;
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
}
