package org.caterfind.service;

import java.time.LocalDate;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private CalendarEventService calendarEventService;

    /**
     * Get all menus for a caterer.
     */
    public List<MenuDTO> getMenusByCatererId(Long catererId) {
        return menuRepository.findByCatererIdOrderByEventDateDescCreatedAtDesc(catererId).stream()
                .map(MenuDTO::new)
                .collect(Collectors.toList());
    }

    /**
         * Get upcoming menus for a caterer where the event date is strictly in the future.
         * Uses tomorrow as the start (excludes today).
     */
    public List<MenuDTO> getUpcomingMenusByCatererId(Long catererId) {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate farFuture = LocalDate.of(2100, 12, 31);

        return menuRepository
            .findByCatererIdAndEventDateBetweenOrderByEventDateDescCreatedAtDesc(catererId, startDate, farFuture)
                .stream()
                .map(MenuDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get past menus for a caterer within the last N days.
     */
    public List<MenuDTO> getPastMenusByCatererId(Long catererId, int days) {
        int safeDays = Math.max(1, days);
        LocalDate today = LocalDate.now();
        LocalDate fromDate = today.minusDays(safeDays);
        LocalDate toDate = today.minusDays(1);

        return menuRepository
                .findByCatererIdAndEventDateBetweenOrderByEventDateDescCreatedAtDesc(catererId, fromDate, toDate)
                .stream()
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
        menu.setEventType(request.getEventType());
        menu.setMealTime(request.getMealTime());
        menu.setEventLocation(request.getEventLocation());
        menu.setEventDate(request.getEventDate());
        menu.setNumberOfGuests(request.getNumberOfGuests());
        menu.setContactNumber(normalizeIndianMobile(request.getContactNumber()));
        menu.setClientEmail(normalizeClientEmail(request.getClientEmail()));
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
                    dishRequest.getDisplayOrder(),
                    dishRequest.getNote()
                );
                menu.getDishes().add(menuDish);
            }
        }

        Menu savedMenu = menuRepository.save(menu);
        calendarEventService.syncMenuEvent(savedMenu);
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
        menu.setEventType(request.getEventType());
        menu.setMealTime(request.getMealTime());
        menu.setEventLocation(request.getEventLocation());
        menu.setEventDate(request.getEventDate());
        menu.setNumberOfGuests(request.getNumberOfGuests());
        menu.setContactNumber(normalizeIndianMobile(request.getContactNumber()));
        menu.setClientEmail(normalizeClientEmail(request.getClientEmail()));

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
                    dishRequest.getDisplayOrder(),
                    dishRequest.getNote()
                );
                menu.getDishes().add(menuDish);
            }
        }

        Menu updatedMenu = menuRepository.save(menu);
        calendarEventService.syncMenuEvent(updatedMenu);
        return new MenuDTO(updatedMenu);
    }

    /**
     * Send menu to client (change status to SENT and send email).
     */
    @Transactional
    public MenuDTO sendMenuToClient(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + id));

        String recipientEmail = normalizeClientEmail(menu.getClientEmail());

        try {
            String subject = "Menu Proposal for " + menu.getEventLocation();
            String body = buildMenuEmailBody(menu);
            emailService.sendEmail(recipientEmail, subject, body);
            // System.out.println("✅ Menu email sent to: " + recipientEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send menu email: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to send menu email to client. Please verify email configuration and try again.");
        }

        menu.setStatus(Menu.MenuStatus.SENT);
        menu.setSentAt(LocalDateTime.now());

        Menu updatedMenu = menuRepository.save(menu);
        calendarEventService.syncMenuEvent(updatedMenu);
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
        body.append("Type: ").append(menu.getEventType()).append("\n");
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
                        if (menuDish.getNote() != null && !menuDish.getNote().trim().isEmpty()) {
                            body.append("      Note: ").append(menuDish.getNote().trim()).append("\n");
                        }
                    });
                    body.append("\n");
                });

        body.append("Please contact us at ").append(menu.getContactNumber());
        body.append(" if you have any questions or would like to discuss modifications.\n\n");
        body.append("Best regards,\n");
        body.append(menu.getCaterer().getEmail());

        return body.toString();
    }

    private String normalizeIndianMobile(String contactNumber) {
        if (contactNumber == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact number is required");
        }

        String digitsOnly = contactNumber.replaceAll("\\D", "");
        if (!digitsOnly.matches("^[6-9]\\d{9}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact number must be a valid 10-digit Indian mobile number");
        }

        return "+91" + digitsOnly;
    }

    private String normalizeClientEmail(String clientEmail) {
        if (clientEmail == null || clientEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Client email is required");
        }

        String normalizedEmail = clientEmail.trim().toLowerCase();
        if (!normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Client email must be a valid email address");
        }

        return normalizedEmail;
    }

    /**
     * Delete a menu.
     */
    @Transactional
    public void deleteMenu(Long id) {
        if (!menuRepository.existsById(id)) {
            throw new RuntimeException("Menu not found with id: " + id);
        }
        calendarEventService.deleteMenuEvent(id);
        menuRepository.deleteById(id);
    }
}
