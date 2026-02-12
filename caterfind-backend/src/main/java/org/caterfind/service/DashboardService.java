package org.caterfind.service;

import org.caterfind.dto.DashboardSummary;
import org.caterfind.repository.ContactRepository;
import org.caterfind.repository.InventoryItemRepository;
import org.caterfind.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Dashboard service for aggregating summary statistics.
 * 
 * Provides simple counts for dashboard widgets:
 * - Total contacts
 * - Low stock items count
 * - Total messages sent
 * 
 * INTENTIONALLY EXCLUDED:
 * - NO charts or graphs
 * - NO analytics
 * - NO calendar or availability
 * 
 * Simple stat cards only.
 */
@Service
public class DashboardService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private MessageRepository messageRepository;

    /**
     * Get dashboard summary statistics for a caterer.
     * 
     * Aggregates counts from different repositories.
     * 
     * @param catererId User ID of the caterer
     * @return DashboardSummary with stat counts
     */
    public DashboardSummary getDashboardSummary(Long catererId) {
        // Count total contacts
        long totalContacts = contactRepository.countByCatererId(catererId);

        // Count low stock items (quantity < minThreshold)
        long lowStockCount = inventoryItemRepository.countLowStockItemsByCatererId(catererId);

        // Count total messages sent
        long totalMessages = messageRepository.countByCatererId(catererId);

        return new DashboardSummary(totalContacts, lowStockCount, totalMessages);
    }
}
