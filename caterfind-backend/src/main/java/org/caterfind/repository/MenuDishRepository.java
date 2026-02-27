package org.caterfind.repository;

import org.caterfind.entity.MenuDish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for MenuDish entity.
 */
@Repository
public interface MenuDishRepository extends JpaRepository<MenuDish, Long> {
    
}
