package org.caterfind.controller;

import org.caterfind.dto.CateringProfileDTO;
import org.caterfind.service.CateringProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing catering business profiles.
 */
@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class CateringProfileController {

    @Autowired
    private CateringProfileService cateringProfileService;

    /**
     * Get catering profile by user ID.
     *
     * @param catererId User ID of the caterer
     * @return CateringProfileDTO or 404 if not found
     */
    @GetMapping
    public ResponseEntity<CateringProfileDTO> getProfile(@RequestParam Long catererId) {
        CateringProfileDTO profile = cateringProfileService.getProfile(catererId);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }

    /**
     * Update catering profile.
     *
     * @param catererId User ID of the caterer
     * @param dto       Updated profile data
     * @return Updated CateringProfileDTO
     */
    @PutMapping
    public ResponseEntity<CateringProfileDTO> updateProfile(@RequestParam Long catererId,
            @RequestBody CateringProfileDTO dto) {
        CateringProfileDTO updatedProfile = cateringProfileService.updateProfile(catererId, dto);
        return ResponseEntity.ok(updatedProfile);
    }
}
