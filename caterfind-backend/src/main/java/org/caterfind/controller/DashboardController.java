package org.caterfind.controller;

import org.caterfind.dto.DashboardSummary;
import org.caterfind.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Dashboard controller for summary statistics.
 * 
 * Endpoints:
 * - GET /dashboard/summary - Get dashboard stats
 * 
 * Returns simple counts for dashboard widgets:
 * - Total contacts
 * - Low stock items count
 * - Total messages sent
 * 
 * NO charts, NO analytics, NO graphs (intentionally excluded).
 */
@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get dashboard summary statistics.
     * 
     * Returns counts for dashboard widgets.
     * Frontend displays these as simple stat cards.
     * 
     * @param catererId User ID of the caterer (from session/auth)
     * @return DashboardSummary with stat counts
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> getDashboardSummary(@RequestParam Long catererId) {
        DashboardSummary summary = dashboardService.getDashboardSummary(catererId);
        return ResponseEntity.ok(summary);
    }
}
