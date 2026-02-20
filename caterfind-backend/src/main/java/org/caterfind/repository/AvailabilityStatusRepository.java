package org.caterfind.repository;

import org.caterfind.entity.AvailabilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Availability Status Repository
 */
@Repository
public interface AvailabilityStatusRepository extends JpaRepository<AvailabilityStatus, Long> {

    Optional<AvailabilityStatus> findByUserIdAndAvailableDate(Long userId, LocalDate availableDate);

    List<AvailabilityStatus> findByUserIdAndAvailableDateBetweenOrderByAvailableDateAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    void deleteByUserIdAndAvailableDate(Long userId, LocalDate availableDate);
}
