package org.caterfind.repository;

import java.util.List;

import org.caterfind.entity.ClientShortlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientShortlistRepository extends JpaRepository<ClientShortlist, Long> {

    List<ClientShortlist> findByClientIdOrderByCreatedAtDesc(Long clientId);

    boolean existsByClientIdAndCatererId(Long clientId, Long catererId);

    void deleteByClientIdAndCatererId(Long clientId, Long catererId);
}
