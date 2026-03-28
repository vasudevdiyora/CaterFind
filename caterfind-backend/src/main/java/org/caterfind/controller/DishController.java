package org.caterfind.controller;

import java.util.List;
import java.util.Map;

import org.caterfind.dto.DishDTO;
import org.caterfind.service.DishService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dishes")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class DishController {
    
    private static final Logger logger = LoggerFactory.getLogger(DishController.class);

    @Autowired
    private DishService dishService;

    @GetMapping
    public ResponseEntity<?> getAllDishes(@RequestParam Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid userId"));
            }
            List<DishDTO> dishes = dishService.getDishesByUserId(userId);
            return ResponseEntity.ok(dishes);
        } catch (Exception e) {
            logger.error("[DishController] Error fetching dishes for userId: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch dishes"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createDish(@RequestBody DishDTO dishDTO) {
        try {
            if (dishDTO == null || dishDTO.getName() == null || dishDTO.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Dish name is required"));
            }
            DishDTO created = dishService.createDish(dishDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            logger.error("[DishController] Error creating dish", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create dish"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDish(@PathVariable Long id, @RequestBody DishDTO dishDTO) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid dish id"));
            }
            if (dishDTO == null || dishDTO.getName() == null || dishDTO.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Dish name is required"));
            }
            DishDTO updated = dishService.updateDish(id, dishDTO);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("[DishController] Error updating dish with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update dish"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDish(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid dish id"));
            }
            dishService.deleteDish(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("[DishController] Error deleting dish with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete dish"));
        }
    }
}
