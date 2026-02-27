package org.caterfind.entity;

import javax.persistence.*;

/**
 * MenuDish entity representing a dish in a menu with its category assignment.
 */
@Entity
@Table(name = "menu_dishes")
public class MenuDish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    @Column(name = "menu_category", nullable = false)
    private String menuCategory; // e.g., "Main Course", "Starter", "Dessert", "Beverage"

    @Column(name = "display_order")
    private Integer displayOrder;

    // Constructors
    public MenuDish() {
    }

    public MenuDish(Menu menu, Dish dish, String menuCategory, Integer displayOrder) {
        this.menu = menu;
        this.dish = dish;
        this.menuCategory = menuCategory;
        this.displayOrder = displayOrder;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Menu getMenu() {
        return menu;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public Dish getDish() {
        return dish;
    }

    public void setDish(Dish dish) {
        this.dish = dish;
    }

    public String getMenuCategory() {
        return menuCategory;
    }

    public void setMenuCategory(String menuCategory) {
        this.menuCategory = menuCategory;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
