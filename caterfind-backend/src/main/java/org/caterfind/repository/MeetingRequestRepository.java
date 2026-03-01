package org.caterfind.repository;

import java.util.List;

import org.caterfind.entity.MeetingRequest;
import org.caterfind.entity.MeetingRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for MeetingRequest entity.
 */
@Repository
public interface MeetingRequestRepository extends JpaRepository<MeetingRequest, Long> {

    /**
     * Find all meeting requests for a specific caterer.
     * Used by caterer to view all incoming requests.
     * Uses JOIN FETCH to avoid N+1 query problem.
     */
    @Query("SELECT m FROM MeetingRequest m " +
           "JOIN FETCH m.client " +
           "JOIN FETCH m.caterer " +
           "WHERE m.caterer.id = :catererId " +
           "ORDER BY m.createdAt DESC")
    List<MeetingRequest> findByCatererId(@Param("catererId") Long catererId);

    /**
     * Find all meeting requests sent by a specific client.
     * Used by client to view their sent requests.
     * Uses JOIN FETCH to avoid N+1 query problem.
     */
    @Query("SELECT m FROM MeetingRequest m " +
           "JOIN FETCH m.client " +
           "JOIN FETCH m.caterer " +
           "WHERE m.client.id = :clientId " +
           "ORDER BY m.createdAt DESC")
    List<MeetingRequest> findByClientId(@Param("clientId") Long clientId);

    /**
     * Find meeting requests for a caterer filtered by status.
     * Uses JOIN FETCH to avoid N+1 query problem.
     */
    @Query("SELECT m FROM MeetingRequest m " +
           "JOIN FETCH m.client " +
           "JOIN FETCH m.caterer " +
           "WHERE m.caterer.id = :catererId AND m.status = :status " +
           "ORDER BY m.createdAt DESC")
    List<MeetingRequest> findByCatererIdAndStatus(
        @Param("catererId") Long catererId, 
        @Param("status") RequestStatus status
    );

    /**
     * Find meeting requests by client filtered by status.
     * Uses JOIN FETCH to avoid N+1 query problem.
     */
    @Query("SELECT m FROM MeetingRequest m " +
           "JOIN FETCH m.client " +
           "JOIN FETCH m.caterer " +
           "WHERE m.client.id = :clientId AND m.status = :status " +
           "ORDER BY m.createdAt DESC")
    List<MeetingRequest> findByClientIdAndStatus(
        @Param("clientId") Long clientId, 
        @Param("status") RequestStatus status
    );

    /**
     * Count pending requests for a caterer (useful for badge count).
     */
    @Query("SELECT COUNT(m) FROM MeetingRequest m WHERE m.caterer.id = :catererId AND m.status = 'PENDING'")
    Long countPendingByCatererId(@Param("catererId") Long catererId);
}
