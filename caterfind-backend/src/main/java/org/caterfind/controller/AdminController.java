package org.caterfind.controller;

import java.util.HashMap;
import java.util.Map;

import org.caterfind.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AdminController {

    @Autowired
    private AdminService adminService;

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardData() {
        try {
            return ResponseEntity.ok(adminService.getDashboardData());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/caterers")
    public ResponseEntity<?> getCaterers(@RequestParam(defaultValue = "all") String status) {
        try {
            return ResponseEntity.ok(adminService.getCaterers(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PutMapping("/caterers/{id}/status")
    public ResponseEntity<?> updateCatererStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(adminService.updateCatererStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/clients")
    public ResponseEntity<?> getClients() {
        try {
            return ResponseEntity.ok(adminService.getClients());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/moderation")
    public ResponseEntity<?> getModerationReports(@RequestParam(defaultValue = "all") String status) {
        try {
            return ResponseEntity.ok(adminService.getModerationReports(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PutMapping("/moderation/{id}")
    public ResponseEntity<?> updateModerationStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String action = payload.get("action");
            if (action == null || action.isBlank()) {
                return ResponseEntity.badRequest().body(error("action is required"));
            }
            return ResponseEntity.ok(adminService.updateModerationStatus(id, action));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            return ResponseEntity.ok(adminService.getSettings());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PutMapping("/settings")
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Admin saveSettings called with payload: {}", payload);
            return ResponseEntity.ok(adminService.saveSettings(payload));
        } catch (Exception e) {
            log.error("Failed to save admin settings", e);
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    private Map<String, String> error(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
