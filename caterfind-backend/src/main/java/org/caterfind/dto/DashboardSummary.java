package org.caterfind.dto;

/**
 * DTO for dashboard summary statistics.
 * 
 * Contains counts for dashboard widgets:
 * - Total contacts
 * - Low stock items count
 * - Total messages sent
 * 
 * NO charts, NO analytics, NO graphs (intentionally excluded).
 * Simple stat cards only.
 */
public class DashboardSummary {

    private long totalContacts;
    private long lowStockItemsCount;
    private long totalMessagesSent;

    // Constructors
    public DashboardSummary() {
    }

    public DashboardSummary(long totalContacts, long lowStockItemsCount, long totalMessagesSent) {
        this.totalContacts = totalContacts;
        this.lowStockItemsCount = lowStockItemsCount;
        this.totalMessagesSent = totalMessagesSent;
    }

    // Getters and Setters
    public long getTotalContacts() {
        return totalContacts;
    }

    public void setTotalContacts(long totalContacts) {
        this.totalContacts = totalContacts;
    }

    public long getLowStockItemsCount() {
        return lowStockItemsCount;
    }

    public void setLowStockItemsCount(long lowStockItemsCount) {
        this.lowStockItemsCount = lowStockItemsCount;
    }

    public long getTotalMessagesSent() {
        return totalMessagesSent;
    }

    public void setTotalMessagesSent(long totalMessagesSent) {
        this.totalMessagesSent = totalMessagesSent;
    }
}
