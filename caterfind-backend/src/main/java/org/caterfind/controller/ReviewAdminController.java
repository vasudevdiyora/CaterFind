package org.caterfind.controller;

import org.caterfind.service.ReviewService;
import org.caterfind.dto.ReviewDTO;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ReviewAdminController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserRepository userRepository;

    @PutMapping("/{id}/visibility")
    public ResponseEntity<?> setVisibility(@PathVariable Long id, @RequestParam boolean visible, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authentication required"));
            }

            String email = authentication.getName();
            User actor = userRepository.findByEmail(email).orElse(null);
            if (actor == null || actor.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin role required"));
            }

            ReviewDTO dto = reviewService.setVisibility(id, visible);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listAllReviews(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authentication required"));
            }

            String email = authentication.getName();
            User actor = userRepository.findByEmail(email).orElse(null);
            if (actor == null || actor.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin role required"));
            }

            return ResponseEntity.ok(reviewService.listAllReviews());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
