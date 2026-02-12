package org.caterfind.repository;

import org.caterfind.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for InventoryItem entity.
 * 
 * Provides database access methods for inventory management.
 */
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    /**
     * Find all inventory items belonging to a specific caterer.
     * Used in Inventory Management screen.
     * 
     * @param catererId User ID of the caterer
     * @return List of inventory items owned by the caterer
     */
    List<InventoryItem> findByCatererId(Long catererId);

    /**
     * Find all low-stock items for a specific caterer.
     * Low stock = quantity < minThreshold
     * Used for dashboard widget and low-stock alerts.
     * 
     * @param catererId User ID of the caterer
     * @return List of low-stock inventory items
     */
    @Query("SELECT i FROM InventoryItem i WHERE i.catererId = ?1 AND i.quantity <= i.minThreshold")
    List<InventoryItem> findLowStockItemsByCatererId(Long catererId);

    /**
     * Count low-stock items for a caterer.
     * Used for dashboard summary widget.
     * 
     * @param catererId User ID of the caterer
     * @return Count of low-stock items
     */
    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.catererId = ?1 AND i.quantity <= i.minThreshold")
    long countLowStockItemsByCatererId(Long catererId);
}
