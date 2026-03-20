package org.caterfind.controller;

import java.security.Principal;
import java.util.Map;

import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.caterfind.service.ClientDiscoveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discovery")
public class ClientDiscoveryController {

    @Autowired
    private ClientDiscoveryService clientDiscoveryService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/shortlist")
    public ResponseEntity<?> getShortlist(Principal principal) {
        try {
            User client = requireClient(principal);
            return ResponseEntity.ok(Map.of(
                    "ids", clientDiscoveryService.getShortlistedCatererIds(client.getId())));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/caterers")
    public ResponseEntity<?> searchCaterers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer minServiceRadius,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "relevance") String sortBy,
            Principal principal) {
        try {
            User client = requireClient(principal);
            return ResponseEntity.ok(clientDiscoveryService.searchCaterers(
                    client.getId(),
                    q,
                    city,
                    area,
                    minRating,
                    minServiceRadius,
                    lat,
                    lng,
                    sortBy));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/shortlist/{catererId}")
    public ResponseEntity<?> addToShortlist(@PathVariable Long catererId, Principal principal) {
        try {
            User client = requireClient(principal);
            return ResponseEntity.ok(clientDiscoveryService.addToShortlist(client.getId(), catererId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/shortlist/{catererId}")
    public ResponseEntity<?> removeFromShortlist(@PathVariable Long catererId, Principal principal) {
        try {
            User client = requireClient(principal);
            return ResponseEntity.ok(clientDiscoveryService.removeFromShortlist(client.getId(), catererId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    private User requireClient(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new SecurityException("Authentication required");
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found"));

        if (user.getRole() != User.UserRole.CLIENT) {
            throw new SecurityException("Only clients can access shortlist");
        }

        return user;
    }
}
