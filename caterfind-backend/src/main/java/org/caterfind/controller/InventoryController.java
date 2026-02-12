package org.caterfind.controller;

import org.caterfind.dto.InventoryDTO;
import org.caterfind.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Inventory controller for managing caterer's inventory.
 * 
 * Endpoints:
 * - GET /inventory - List all inventory items
 * - GET /inventory/low-stock - List low-stock items
 * - GET /inventory/{id} - Get single item
 * - POST /inventory - Create item
 * - PUT /inventory/{id} - Update item
 * - DELETE /inventory/{id} - Delete item
 * 
 * Low stock detection: quantity < minThreshold
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO billing or invoicing
 * - NO supplier ordering
 * - NO purchase order flow
 */
@RestController
@RequestMapping("/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    /**
     * Get all inventory items for a caterer.
     * 
     * @param catererId User ID of the caterer
     * @return List of InventoryDTOs
     */
    @GetMapping
    public ResponseEntity<List<InventoryDTO>> getAllInventory(@RequestParam Long catererId) {
        List<InventoryDTO> items = inventoryService.getAllInventory(catererId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get all low-stock items for a caterer.
     * Used for dashboard widget and low-stock alerts.
     * 
     * @param catererId User ID of the caterer
     * @return List of low-stock InventoryDTOs
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryDTO>> getLowStockItems(@RequestParam Long catererId) {
        List<InventoryDTO> items = inventoryService.getLowStockItems(catererId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get a single inventory item by ID.
     * 
     * @param id Item ID
     * @return InventoryDTO or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<InventoryDTO> getInventoryById(@PathVariable Long id) {
        InventoryDTO item = inventoryService.getInventoryById(id);
        if (item != null) {
            return ResponseEntity.ok(item);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new inventory item.
     * 
     * @param catererId    User ID of the caterer
     * @param inventoryDTO Inventory data
     * @return Created InventoryDTO
     */
    @PostMapping
    public ResponseEntity<InventoryDTO> createInventoryItem(
            @RequestParam Long catererId,
            @RequestBody InventoryDTO inventoryDTO) {
        InventoryDTO created = inventoryService.createInventoryItem(catererId, inventoryDTO);
        return ResponseEntity.ok(created);
    }

    /**
     * Update an existing inventory item.
     * 
     * @param id           Item ID
     * @param inventoryDTO Updated inventory data
     * @return Updated InventoryDTO or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<InventoryDTO> updateInventoryItem(
            @PathVariable Long id,
            @RequestBody InventoryDTO inventoryDTO) {
        InventoryDTO updated = inventoryService.updateInventoryItem(id, inventoryDTO);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete an inventory item.
     * 
     * @param id Item ID
     * @return 204 No Content if deleted, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        boolean deleted = inventoryService.deleteInventoryItem(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
