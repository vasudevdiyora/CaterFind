package org.caterfind.repository;

import java.util.List;

import org.caterfind.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCatererIdOrderByCreatedAtDesc(Long catererId);
    List<Review> findByCatererIdAndVisibleTrueOrderByCreatedAtDesc(Long catererId);

    Long countByCatererId(Long catererId);

    Review findByCatererIdAndUserId(Long catererId, Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.catererId = :catererId AND r.visible = true")
    Double findAverageRating(@Param("catererId") Long catererId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.catererId = :catererId AND r.visible = true GROUP BY r.rating")
    List<Object[]> countByRating(@Param("catererId") Long catererId);
}
