package org.caterfind.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.caterfind.dto.ReviewDTO;
import org.caterfind.dto.ReviewRequest;
import org.caterfind.entity.Review;
import org.caterfind.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public ReviewDTO createReview(Long catererId, ReviewRequest req) {
        if (req.getRating() == null || req.getRating() < 1 || req.getRating() > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }

        // Upsert: if same user already reviewed this caterer, update instead of creating duplicate
        Review existing = null;
        if (req.getUserId() != null) {
            existing = reviewRepository.findByCatererIdAndUserId(catererId, req.getUserId());
        }

        if (existing != null) {
            // rate-limit: prevent rapid repeated edits (30s window)
            Instant now = Instant.now();
            Instant lastUpdated = existing.getUpdatedAt() != null ? existing.getUpdatedAt() : existing.getCreatedAt();
            if (lastUpdated != null && Duration.between(lastUpdated, now).abs().getSeconds() < 30) {
                throw new IllegalArgumentException("Please wait a moment before updating your review again.");
            }

            existing.setRating(req.getRating());
            existing.setTitle(req.getTitle());
            existing.setBody(req.getBody());
            existing.setUpdatedAt(now);
            Review saved = reviewRepository.save(existing);
            return toDto(saved);
        }

        Review r = new Review();
        r.setCatererId(catererId);
        r.setUserId(req.getUserId());
        r.setRating(req.getRating());
        r.setTitle(req.getTitle());
        r.setBody(req.getBody());
        r.setVisible(true);
        r.setCreatedAt(Instant.now());
        r.setUpdatedAt(Instant.now());

        Review saved = reviewRepository.save(r);
        return toDto(saved);
    }

    public List<ReviewDTO> listReviews(Long catererId) {
        List<Review> list = reviewRepository.findByCatererIdAndVisibleTrueOrderByCreatedAtDesc(catererId);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Map<String, Object> ratingSummary(Long catererId) {
        Double avg = reviewRepository.findAverageRating(catererId);
        Long count = reviewRepository.countByCatererId(catererId);

        List<Object[]> rows = reviewRepository.countByRating(catererId);
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        if (rows != null) {
            for (Object[] row : rows) {
                if (row.length >= 2 && row[0] instanceof Number && row[1] instanceof Number) {
                    Integer rating = ((Number) row[0]).intValue();
                    Long cnt = ((Number) row[1]).longValue();
                    distribution.put(rating, cnt);
                }
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("average", avg == null ? 0.0 : avg);
        out.put("count", count == null ? 0L : count);
        out.put("distribution", distribution);
        return out;
    }

    public List<ReviewDTO> listAllReviews() {
        List<Review> list = reviewRepository.findAll();
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public ReviewDTO setVisibility(Long reviewId, boolean visible) {
        Review r = reviewRepository.findById(reviewId).orElseThrow(() -> new IllegalArgumentException("Review not found"));
        r.setVisible(visible);
        r.setUpdatedAt(Instant.now());
        Review saved = reviewRepository.save(r);
        return toDto(saved);
    }

    private ReviewDTO toDto(Review r) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(r.getId());
        dto.setUserId(r.getUserId());
        dto.setRating(r.getRating());
        dto.setTitle(r.getTitle());
        dto.setBody(r.getBody());
        dto.setVisible(r.getVisible());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
