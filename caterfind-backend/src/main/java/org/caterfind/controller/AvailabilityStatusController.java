package org.caterfind.controller;

import org.caterfind.dto.AvailabilityStatusDTO;
import org.caterfind.service.AvailabilityStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Availability Status Controller
 */
@RestController
@RequestMapping("/api/availability")
@CrossOrigin(origins = "*")
public class AvailabilityStatusController {

    @Autowired
    private AvailabilityStatusService service;

    /**
     * Set availability status
     * POST /api/availability?userId=1
     * Body: { "date": "2026-02-21", "status": "available" }
     */
    @PostMapping
    public ResponseEntity<?> setStatus(@RequestParam Long userId, @RequestBody AvailabilityStatusDTO dto) {
        try {
            dto.setUserId(userId);
            AvailabilityStatusDTO result = service.setStatus(userId, dto);
            if (result == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update availability"));
        }
    }

    /**
     * Get availability status for a user in date range
     * GET /api/availability?userId=1&startDate=2026-02-01&endDate=2026-02-28
     */
    @GetMapping
    public ResponseEntity<List<AvailabilityStatusDTO>> getByRange(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<AvailabilityStatusDTO> results = service.getByDateRange(userId, startDate, endDate);
        return ResponseEntity.ok(results);
    }
}
