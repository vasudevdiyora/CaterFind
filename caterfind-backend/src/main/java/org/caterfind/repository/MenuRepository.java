package org.caterfind.repository;

import java.util.List;
import java.time.LocalDate;

import org.caterfind.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Menu entity.
 */
@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    
    /**
     * Find all menus for a specific caterer.
     */
    List<Menu> findByCatererId(Long catererId);

    /**
     * Find all menus for a specific caterer ordered by event date descending.
     */
    List<Menu> findByCatererIdOrderByEventDateDescCreatedAtDesc(Long catererId);

    /**
     * Find menus for a caterer between dates ordered by event date descending.
     */
    List<Menu> findByCatererIdAndEventDateBetweenOrderByEventDateDescCreatedAtDesc(Long catererId, LocalDate fromDate, LocalDate toDate);
    
    /**
     * Find all menus for a specific caterer with a specific status.
     */
    List<Menu> findByCatererIdAndStatus(Long catererId, Menu.MenuStatus status);
}
