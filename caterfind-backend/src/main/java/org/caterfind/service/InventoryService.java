package org.caterfind.service;

import org.caterfind.dto.InventoryDTO;
import org.caterfind.entity.Contact;
import org.caterfind.entity.InventoryItem;
import org.caterfind.repository.ContactRepository;
import org.caterfind.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Inventory service for managing caterer's inventory.
 * 
 * Features:
 * - CRUD operations for inventory items
 * - Automatic low-stock detection (quantity < minThreshold)
 * - Optional dealer assignment from contacts
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO billing or invoicing
 * - NO supplier ordering system
 * - NO purchase order flow
 * 
 * This is purely for internal inventory tracking.
 */
@Service
public class InventoryService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private ContactRepository contactRepository;

    /**
     * Get all inventory items for a caterer.
     * 
     * @param catererId User ID of the caterer
     * @return List of InventoryDTOs
     */
    public List<InventoryDTO> getAllInventory(Long catererId) {
        List<InventoryItem> items = inventoryItemRepository.findByCatererId(catererId);
        return items.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all low-stock items for a caterer.
     * Low stock = quantity < minThreshold
     * 
     * @param catererId User ID of the caterer
     * @return List of low-stock InventoryDTOs
     */
    public List<InventoryDTO> getLowStockItems(Long catererId) {
        List<InventoryItem> items = inventoryItemRepository.findLowStockItemsByCatererId(catererId);
        return items.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single inventory item by ID.
     * 
     * @param itemId Item ID
     * @return InventoryDTO or null if not found
     */
    public InventoryDTO getInventoryById(Long itemId) {
        return inventoryItemRepository.findById(itemId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    /**
     * Create a new inventory item.
     * 
     * @param catererId    User ID of the caterer
     * @param inventoryDTO Inventory data
     * @return Created InventoryDTO
     */
    public InventoryDTO createInventoryItem(Long catererId, InventoryDTO inventoryDTO) {
        InventoryItem item = new InventoryItem();
        item.setCatererId(catererId);
        item.setItemName(inventoryDTO.getItemName());
        item.setCategory(InventoryItem.ItemCategory.valueOf(inventoryDTO.getCategory()));
        item.setQuantity(inventoryDTO.getQuantity());
        item.setUnit(inventoryDTO.getUnit());
        item.setMinThreshold(inventoryDTO.getMinThreshold());
        item.setDealerContactId(inventoryDTO.getDealerContactId());
        item.setDealerName(inventoryDTO.getDealerName());
        item.setDealerPhone(inventoryDTO.getDealerPhone());

        InventoryItem saved = inventoryItemRepository.save(item);
        return convertToDTO(saved);
    }

    /**
     * Update an existing inventory item.
     * 
     * @param itemId       Item ID
     * @param inventoryDTO Updated inventory data
     * @return Updated InventoryDTO or null if not found
     */
    public InventoryDTO updateInventoryItem(Long itemId, InventoryDTO inventoryDTO) {
        return inventoryItemRepository.findById(itemId)
                .map(item -> {
                    item.setItemName(inventoryDTO.getItemName());
                    item.setCategory(InventoryItem.ItemCategory.valueOf(inventoryDTO.getCategory()));
                    item.setQuantity(inventoryDTO.getQuantity());
                    item.setUnit(inventoryDTO.getUnit());
                    item.setMinThreshold(inventoryDTO.getMinThreshold());
                    item.setDealerContactId(inventoryDTO.getDealerContactId());
                    item.setDealerName(inventoryDTO.getDealerName());
                    item.setDealerPhone(inventoryDTO.getDealerPhone());

                    InventoryItem updated = inventoryItemRepository.save(item);
                    return convertToDTO(updated);
                })
                .orElse(null);
    }

    /**
     * Delete an inventory item.
     * 
     * @param itemId Item ID
     * @return true if deleted, false if not found
     */
    public boolean deleteInventoryItem(Long itemId) {
        if (inventoryItemRepository.existsById(itemId)) {
            inventoryItemRepository.deleteById(itemId);
            return true;
        }
        return false;
    }

    /**
     * Convert InventoryItem entity to InventoryDTO.
     * Includes dealer name if assigned.
     * 
     * @param item InventoryItem entity
     * @return InventoryDTO
     */
    private InventoryDTO convertToDTO(InventoryItem item) {
        String dealerName = item.getDealerName();
        String dealerPhone = item.getDealerPhone();

        // If linked to a contact, override with contact details (source of truth)
        if (item.getDealerContactId() != null) {
            Contact contact = contactRepository.findById(item.getDealerContactId()).orElse(null);
            if (contact != null) {
                dealerName = contact.getName();
                dealerPhone = contact.getPhone();
                if (dealerPhone == null || dealerPhone.isEmpty()) {
                    dealerPhone = contact.getEmail();
                }
            }
        }

        return new InventoryDTO(
                item.getId(),
                item.getItemName(),
                item.getCategory().name(),
                item.getQuantity(),
                item.getUnit(),
                item.getMinThreshold(),
                item.getDealerContactId(),
                dealerName,
                dealerPhone,
                item.getIsLowStock() // Computed: quantity < minThreshold
        );
    }
}
