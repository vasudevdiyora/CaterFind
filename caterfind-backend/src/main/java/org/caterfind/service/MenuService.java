package org.caterfind.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    @Transactional(readOnly = true)
    public List<MenuDTO> getMenusByCatererId(Long catererId) {
        return menuRepository.findByCatererIdOrderByEventDateDescCreatedAtDesc(catererId).stream()
                .map(MenuDTO::new)
                .collect(Collectors.toList());
    }

    /**
         * Get upcoming menus for a caterer where the event date is strictly in the future.
         * Uses tomorrow as the start (excludes today).
     */
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
            String body = buildMenuEmailHtml(menu);
            emailService.sendHtmlEmail(recipientEmail, subject, body);
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
     * Build HTML email body for menu.
     */
    private String buildMenuEmailHtml(Menu menu) {
        String brandName = menu.getCaterer() != null && menu.getCaterer().getDisplayName() != null
                ? menu.getCaterer().getDisplayName()
                : "CaterFind";

        Map<String, List<MenuDish>> groupedDishes = menu.getDishes().stream()
                .sorted(Comparator.comparing((MenuDish dish) -> categorySortRank(dish.getMenuCategory()))
                        .thenComparing(dish -> dish.getDisplayOrder() == null ? Integer.MAX_VALUE : dish.getDisplayOrder())
                        .thenComparing(dish -> dish.getDish().getName(), String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.groupingBy(
                        dish -> formatCategoryName(dish.getMenuCategory()),
                        LinkedHashMap::new,
                        Collectors.toList()));

        StringBuilder menuSections = new StringBuilder();
        for (Map.Entry<String, List<MenuDish>> entry : groupedDishes.entrySet()) {
            menuSections.append("<div style=\"margin-top:12px;\">")
                    .append("<strong style=\"display:block;color:#0f172a;font-size:15px;margin-bottom:6px;\">")
                    .append(escapeHtml(entry.getKey()))
                    .append("</strong>")
                    .append("<ul style=\"margin:0;padding-left:18px;color:#334155;\">");

            for (MenuDish menuDish : entry.getValue()) {
                menuSections.append("<li style=\"margin-bottom:6px;line-height:1.5;\">")
                        .append(escapeHtml(menuDish.getDish().getName()));

                if (menuDish.getNote() != null && !menuDish.getNote().trim().isEmpty()) {
                    menuSections.append("<div style=\"color:#64748b;font-size:13px;margin-top:2px;\">Note: ")
                            .append(escapeHtml(menuDish.getNote().trim()))
                            .append("</div>");
                }

                menuSections.append("</li>");
            }

            menuSections.append("</ul></div>");
        }

        return "<!DOCTYPE html>"
                + "<html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                + "<body style=\"margin:0;padding:16px;background:#ffffff;font-family:Arial,sans-serif;color:#1f2937;\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width:640px;margin:0 auto;border-collapse:collapse;\">"
                + "<tr><td style=\"border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 6px 16px rgba(15,23,42,0.08);overflow:hidden;\">"

                + "<div style=\"background:#0ea5e9;color:#ffffff;padding:18px 20px;\">"
                + "<h2 style=\"margin:0;font-size:22px;line-height:1.3;\">" + escapeHtml(brandName) + "</h2>"
                + "</div>"

                + "<div style=\"padding:20px;\">"
                + "<p style=\"margin:0 0 12px 0;font-size:16px;\">Hi " + escapeHtml(menu.getClientName()) + ",</p>"
                + "<p style=\"margin:0 0 16px 0;line-height:1.6;color:#334155;\">"
                + "Thank you for considering our catering services. "
                + "Here are your event details and proposed menu."
                + "</p>"

                + "<div style=\"background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;\">"
                + "<h3 style=\"margin:0 0 12px 0;color:#0f172a;font-size:18px;\">Event Details</h3>"
                + "<p style=\"margin:0 0 8px 0;\"><strong>Type:</strong> " + escapeHtml(menu.getEventType()) + "</p>"
                + "<p style=\"margin:0 0 8px 0;\"><strong>Date:</strong> " + escapeHtml(String.valueOf(menu.getEventDate())) + "</p>"
                + "<p style=\"margin:0 0 8px 0;\"><strong>Location:</strong> " + escapeHtml(menu.getEventLocation()) + "</p>"
                + "<p style=\"margin:0;\"><strong>Guests:</strong> " + escapeHtml(String.valueOf(menu.getNumberOfGuests())) + "</p>"
                + "</div>"

                + "<div style=\"margin-top:18px;background:#ffffff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;\">"
                + "<h3 style=\"margin:0;color:#0ea5e9;font-size:18px;\">Proposed Menu</h3>"
                + menuSections
                + "</div>"

                + "<div style=\"margin-top:20px;font-size:14px;line-height:1.6;color:#475569;\">"
                + "<p style=\"margin:0 0 8px 0;\">If you have any questions, contact us:</p>"
                + "<p style=\"margin:0 0 4px 0;\"><strong>Phone:</strong> " + escapeHtml(menu.getContactNumber()) + "</p>"
                + "<p style=\"margin:0 0 8px 0;\"><strong>Email:</strong> " + escapeHtml(menu.getCaterer().getEmail()) + "</p>"
                + "<p style=\"margin:10px 0 0 0;\">Best regards,<br><strong>" + escapeHtml(brandName) + "</strong></p>"
                + "</div>"
                + "</div>"

                + "</td></tr></table>"
                + "</body></html>";
    }

    private String formatCategoryName(String category) {
        if (category == null || category.trim().isEmpty()) {
            return "Other";
        }

        String trimmed = category.trim();
        if ("main course".equalsIgnoreCase(trimmed)) {
            return "Main Course";
        }
        if ("starter".equalsIgnoreCase(trimmed)) {
            return "Starter";
        }
        if ("dessert".equalsIgnoreCase(trimmed)) {
            return "Dessert";
        }
        if ("beverage".equalsIgnoreCase(trimmed) || "beverages".equalsIgnoreCase(trimmed)) {
            return "Beverage";
        }

        String[] words = trimmed.toLowerCase(Locale.ENGLISH).split("\\s+");
        List<String> titleCased = new ArrayList<>();
        for (String word : words) {
            if (word.isEmpty()) {
                continue;
            }
            titleCased.add(Character.toUpperCase(word.charAt(0)) + word.substring(1));
        }
        return String.join(" ", titleCased);
    }

    private int categorySortRank(String category) {
        String normalized = category == null ? "" : category.trim().toLowerCase(Locale.ENGLISH);
        switch (normalized) {
            case "beverage":
            case "beverages":
                return 1;
            case "starter":
                return 2;
            case "main course":
                return 3;
            case "dessert":
                return 4;
            default:
                return 5;
        }
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
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
