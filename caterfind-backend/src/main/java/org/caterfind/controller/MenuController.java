package org.caterfind.controller;

import org.caterfind.dto.MenuDTO;
import org.caterfind.dto.MenuRequest;
import org.caterfind.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for menu builder operations.
 */
@RestController
@RequestMapping("/menus")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class MenuController {

    @Autowired
    private MenuService menuService;

    /**
     * Get all menus for a caterer.
     */
    @GetMapping
    public ResponseEntity<List<MenuDTO>> getMenus(@RequestParam Long catererId) {
        return ResponseEntity.ok(menuService.getMenusByCatererId(catererId));
    }

    /**
     * Get upcoming menus for a caterer from today onward.
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<MenuDTO>> getUpcomingMenus(@RequestParam Long catererId) {
        return ResponseEntity.ok(menuService.getUpcomingMenusByCatererId(catererId));
    }

    /**
     * Get past menus for a caterer for the previous N days (default 30).
     */
    @GetMapping("/past")
    public ResponseEntity<List<MenuDTO>> getPastMenus(
            @RequestParam Long catererId,
            @RequestParam(defaultValue = "30") Integer days) {
        return ResponseEntity.ok(menuService.getPastMenusByCatererId(catererId, days));
    }

    /**
     * Get menu by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MenuDTO> getMenuById(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuById(id));
    }

    /**
     * Create a new menu (draft).
     */
    @PostMapping
    public ResponseEntity<MenuDTO> createMenu(
            @RequestParam Long catererId,
            @RequestBody MenuRequest request) {
        return ResponseEntity.ok(menuService.createMenu(catererId, request));
    }

    /**
     * Update an existing menu.
     */
    @PutMapping("/{id}")
    public ResponseEntity<MenuDTO> updateMenu(
            @PathVariable Long id,
            @RequestBody MenuRequest request) {
        return ResponseEntity.ok(menuService.updateMenu(id, request));
    }

    /**
     * Send menu to client.
     */
    @PostMapping("/{id}/send")
    public ResponseEntity<MenuDTO> sendMenuToClient(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.sendMenuToClient(id));
    }

    /**
     * Delete a menu.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable Long id) {
        menuService.deleteMenu(id);
        return ResponseEntity.noContent().build();
    }
}
