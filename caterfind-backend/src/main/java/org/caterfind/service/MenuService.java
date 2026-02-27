package org.caterfind.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.caterfind.dto.MenuDTO;
import org.caterfind.dto.MenuRequest;
import org.caterfind.entity.Dish;
import org.caterfind.entity.Menu;
import org.caterfind.entity.MenuDish;
import org.caterfind.entity.User;
import org.caterfind.repository.DishRepository;
import org.caterfind.repository.MenuRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing menus.
 */
@Service
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Get all menus for a caterer.
     */
    public List<MenuDTO> getMenusByCatererId(Long catererId) {
        return menuRepository.findByCatererId(catererId).stream()
                .map(MenuDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get menu by ID.
     */
    public MenuDTO getMenuById(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + id));
        return new MenuDTO(menu);
    }

    /**
     * Create a new menu (draft).
     */
    @Transactional
    public MenuDTO createMenu(Long catererId, MenuRequest request) {
        User caterer = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("Caterer not found with id: " + catererId));

        Menu menu = new Menu();
        menu.setCaterer(caterer);
        menu.setClientName(request.getClientName());
        menu.setEventLocation(request.getEventLocation());
        menu.setEventDate(request.getEventDate());
        menu.setNumberOfGuests(request.getNumberOfGuests());
        menu.setContactNumber(request.getContactNumber());
        menu.setClientEmail(request.getClientEmail());
        menu.setStatus(Menu.MenuStatus.DRAFT);

        // Add dishes to menu
        if (request.getDishes() != null && !request.getDishes().isEmpty()) {
            for (MenuRequest.MenuDishRequest dishRequest : request.getDishes()) {
                Dish dish = dishRepository.findById(dishRequest.getDishId())
                        .orElseThrow(() -> new RuntimeException("Dish not found with id: " + dishRequest.getDishId()));
                
                MenuDish menuDish = new MenuDish(
                        menu,
                        dish,
                        dishRequest.getMenuCategory(),
                        dishRequest.getDisplayOrder()
                );
                menu.getDishes().add(menuDish);
            }
        }

        Menu savedMenu = menuRepository.save(menu);
        return new MenuDTO(savedMenu);
    }

    /**
     * Update an existing menu.
     */
    @Transactional
    public MenuDTO updateMenu(Long id, MenuRequest request) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + id));

        menu.setClientName(request.getClientName());
        menu.setEventLocation(request.getEventLocation());
        menu.setEventDate(request.getEventDate());
        menu.setNumberOfGuests(request.getNumberOfGuests());
        menu.setContactNumber(request.getContactNumber());
        menu.setClientEmail(request.getClientEmail());

        // Clear existing dishes and add new ones
        menu.getDishes().clear();
        
        if (request.getDishes() != null && !request.getDishes().isEmpty()) {
            for (MenuRequest.MenuDishRequest dishRequest : request.getDishes()) {
                Dish dish = dishRepository.findById(dishRequest.getDishId())
                        .orElseThrow(() -> new RuntimeException("Dish not found with id: " + dishRequest.getDishId()));
                
                MenuDish menuDish = new MenuDish(
                        menu,
                        dish,
                        dishRequest.getMenuCategory(),
                        dishRequest.getDisplayOrder()
                );
                menu.getDishes().add(menuDish);
            }
        }

        Menu updatedMenu = menuRepository.save(menu);
        return new MenuDTO(updatedMenu);
    }

    /**
     * Send menu to client (change status to SENT and send email).
     */
    @Transactional
    public MenuDTO sendMenuToClient(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + id));

        menu.setStatus(Menu.MenuStatus.SENT);
        menu.setSentAt(LocalDateTime.now());

        Menu updatedMenu = menuRepository.save(menu);

        // Send email if client email is provided
        if (menu.getClientEmail() != null && !menu.getClientEmail().isEmpty()) {
            try {
                String subject = "Menu Proposal for " + menu.getEventLocation();
                String body = buildMenuEmailBody(menu);
                emailService.sendEmail(menu.getClientEmail(), subject, body);
                System.out.println("✅ Menu email sent to: " + menu.getClientEmail());
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send menu email: " + e.getMessage());
                // Don't fail the transaction if email fails
            }
        }

        return new MenuDTO(updatedMenu);
    }

    /**
     * Build email body for menu.
     */
    private String buildMenuEmailBody(Menu menu) {
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(menu.getClientName()).append(",\n\n");
        body.append("Thank you for considering our catering services for your event.\n\n");
        body.append("EVENT DETAILS:\n");
        body.append("Date: ").append(menu.getEventDate()).append("\n");
        body.append("Location: ").append(menu.getEventLocation()).append("\n");
        body.append("Number of Guests: ").append(menu.getNumberOfGuests()).append("\n\n");
        body.append("PROPOSED MENU:\n\n");

        // Group dishes by category
        menu.getDishes().stream()
                .collect(java.util.stream.Collectors.groupingBy(MenuDish::getMenuCategory))
                .forEach((category, dishes) -> {
                    body.append(category.toUpperCase()).append(":\n");
                    dishes.forEach(menuDish -> {
                        body.append("  • ").append(menuDish.getDish().getName()).append("\n");
                    });
                    body.append("\n");
                });

        body.append("Please contact us at ").append(menu.getContactNumber());
        body.append(" if you have any questions or would like to discuss modifications.\n\n");
        body.append("Best regards,\n");
        body.append(menu.getCaterer().getEmail());

        return body.toString();
    }

    /**
     * Delete a menu.
     */
    @Transactional
    public void deleteMenu(Long id) {
        if (!menuRepository.existsById(id)) {
            throw new RuntimeException("Menu not found with id: " + id);
        }
        menuRepository.deleteById(id);
    }
}
