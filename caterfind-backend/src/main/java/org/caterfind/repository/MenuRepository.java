package org.caterfind.repository;

import java.util.List;

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
     * Find all menus for a specific caterer with a specific status.
     */
    List<Menu> findByCatererIdAndStatus(Long catererId, Menu.MenuStatus status);
}
