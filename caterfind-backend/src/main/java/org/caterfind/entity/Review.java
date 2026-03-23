package org.caterfind.entity;

import java.time.Instant;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The caterer being reviewed (references users.id)
    @Column(name = "caterer_id", nullable = false)
    private Long catererId;

    // The user who wrote the review
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Rating: 1..5
    @Column(nullable = false)
    private Integer rating;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "is_visible")
    private Boolean visible = true;

    @Column(name = "helpful_count")
    private Integer helpfulCount = 0;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Review() {}

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCatererId() { return catererId; }
    public void setCatererId(Long catererId) { this.catererId = catererId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }
    public Integer getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(Integer helpfulCount) { this.helpfulCount = helpfulCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
