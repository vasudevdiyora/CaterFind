package org.caterfind.service;

import org.caterfind.dto.AvailabilityStatusDTO;
import org.caterfind.entity.AvailabilityStatus;
import org.caterfind.repository.AvailabilityStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Availability Status Service
 */
@Service
public class AvailabilityStatusService {

    @Autowired
    private AvailabilityStatusRepository repository;

    /**
     * Set availability status for a date (available/busy)
     * If status is null or "neutral", the record is deleted.
     */
    public AvailabilityStatusDTO setStatus(Long userId, AvailabilityStatusDTO dto) {
        if (dto.getDate() == null) {
            throw new IllegalArgumentException("Date is required");
        }

        // Prevent setting availability for past dates
        if (dto.getDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot modify past dates");
        }

        String status = normalizeStatus(dto.getStatus());
        if (status == null) {
            repository.deleteByUserIdAndAvailableDate(userId, dto.getDate());
            return null;
        }

        Optional<AvailabilityStatus> existing = repository.findByUserIdAndAvailableDate(userId, dto.getDate());
        AvailabilityStatus entity = existing.orElseGet(AvailabilityStatus::new);
        entity.setUserId(userId);
        entity.setAvailableDate(dto.getDate());
        entity.setStatus(status);

        AvailabilityStatus saved = repository.save(entity);
        return toDTO(saved);
    }

    /**
     * Get availability status in date range
     */
    public List<AvailabilityStatusDTO> getByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserIdAndAvailableDateBetweenOrderByAvailableDateAsc(userId, startDate, endDate)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private String normalizeStatus(String status) {
        if (status == null) return null;
        String normalized = status.trim().toLowerCase();
        if (normalized.isEmpty() || normalized.equals("neutral")) return null;
        if (!normalized.equals("available") && !normalized.equals("busy")) {
            throw new IllegalArgumentException("Status must be available or busy");
        }
        return normalized;
    }

    private AvailabilityStatusDTO toDTO(AvailabilityStatus entity) {
        return new AvailabilityStatusDTO(
                entity.getId(),
                entity.getUserId(),
                entity.getAvailableDate(),
                entity.getStatus()
        );
    }
}
