package org.caterfind.dto;

import org.caterfind.entity.MenuDish;

/**
 * DTO for MenuDish.
 */
public class MenuDishDTO {
    private Long id;
    private Long dishId;
    private String dishName;
    private String dishCategory;
    private String dishImageUrl;
    private String dishType;
    private String dishLabels;
    private String menuCategory;
    private Integer displayOrder;
    private String note;

    // Constructors
    public MenuDishDTO() {
    }

    public MenuDishDTO(MenuDish menuDish) {
        this.id = menuDish.getId();
        this.dishId = menuDish.getDish().getId();
        this.dishName = menuDish.getDish().getName();
        this.dishCategory = menuDish.getDish().getCategory();
        this.dishImageUrl = menuDish.getDish().getImageUrl();
        this.dishType = menuDish.getDish().getType();
        this.dishLabels = menuDish.getDish().getLabels();
        this.menuCategory = menuDish.getMenuCategory();
        this.displayOrder = menuDish.getDisplayOrder();
        this.note = menuDish.getNote();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDishId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
    }

    public String getDishName() {
        return dishName;
    }

    public void setDishName(String dishName) {
        this.dishName = dishName;
    }

    public String getDishCategory() {
        return dishCategory;
    }

    public void setDishCategory(String dishCategory) {
        this.dishCategory = dishCategory;
    }

    public String getDishImageUrl() {
        return dishImageUrl;
    }

    public void setDishImageUrl(String dishImageUrl) {
        this.dishImageUrl = dishImageUrl;
    }

    public String getDishType() {
        return dishType;
    }

    public void setDishType(String dishType) {
        this.dishType = dishType;
    }

    public String getDishLabels() {
        return dishLabels;
    }

    public void setDishLabels(String dishLabels) {
        this.dishLabels = dishLabels;
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
