package org.caterfind.controller;

import org.caterfind.dto.ReviewDTO;
import org.caterfind.dto.ReviewRequest;
import org.caterfind.service.ReviewService;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caterers/{catererId}/reviews")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createReview(@PathVariable Long catererId, @RequestBody ReviewRequest request, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authentication required"));
            }

            String email = authentication.getName();
            User actor = userRepository.findByEmail(email).orElse(null);
            if (actor == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authenticated user not found"));
            }

            // Prevent users from reviewing their own caterer profile
            if (actor.getRole() == User.UserRole.CATERER && actor.getId().equals(catererId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Caterers cannot review their own profile"));
            }

            // Attach authenticated user id and upsert
            request.setUserId(actor.getId());
            ReviewDTO dto = reviewService.createReview(catererId, request);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ReviewDTO>> listReviews(@PathVariable Long catererId) {
        return ResponseEntity.ok(reviewService.listReviews(catererId));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> ratingSummary(@PathVariable Long catererId) {
        return ResponseEntity.ok(reviewService.ratingSummary(catererId));
    }
}
