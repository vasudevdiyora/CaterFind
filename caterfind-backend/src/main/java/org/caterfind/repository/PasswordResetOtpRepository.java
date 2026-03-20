package org.caterfind.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.caterfind.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailOrderByCreatedAtDesc(String email);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
