package org.caterfind.controller;

import java.util.List;
import java.util.Map;

import org.caterfind.dto.ContactDTO;
import org.caterfind.service.ContactService;
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

/**
 * Contact controller for managing caterer's contacts.
 * 
 * Endpoints:
 * - GET /contacts - List all contacts
 * - GET /contacts/{id} - Get single contact
 * - POST /contacts - Create contact
 * - PUT /contacts/{id} - Update contact
 * - DELETE /contacts/{id} - Delete contact
 * 
 * Contacts can be: Staff, Chef, Helper, Supplier, Dealer (via labels).
 * 
 * IMPORTANT: These are NOT client event contacts.
 * These are internal contacts for caterer coordination.
 */
@RestController
@RequestMapping("/contacts")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ContactController {

    @Autowired
    private ContactService contactService;

    /**
     * Get all contacts for a caterer.
     * 
     * @param catererId User ID of the caterer
     * @return List of ContactDTOs
     */
    @GetMapping
    public ResponseEntity<List<ContactDTO>> getAllContacts(@RequestParam Long catererId) {
        List<ContactDTO> contacts = contactService.getAllContacts(catererId);
        return ResponseEntity.ok(contacts);
    }

    /**
     * Get a single contact by ID.
     * 
     * @param id Contact ID
     * @return ContactDTO or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContactDTO> getContactById(@PathVariable Long id) {
        ContactDTO contact = contactService.getContactById(id);
        if (contact != null) {
            return ResponseEntity.ok(contact);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new contact.
     * 
     * @param catererId  User ID of the caterer
     * @param contactDTO Contact data
     * @return Created ContactDTO or error response
     */
    @PostMapping
    public ResponseEntity<?> createContact(
            @RequestParam Long catererId,
            @RequestBody ContactDTO contactDTO) {
        try {
            // Validate required fields
            if (contactDTO.getName() == null || contactDTO.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Contact name is required"));
            }
            
            if (contactDTO.getPhone() == null || contactDTO.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Phone number is required"));
            }
            
            // Validate enum values
            if (contactDTO.getPreferredContactMethod() != null) {
                try {
                    org.caterfind.entity.Contact.ContactMethod.valueOf(contactDTO.getPreferredContactMethod());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid preferredContactMethod. Must be EMAIL, SMS, or CALL"));
                }
            }
            
            if (contactDTO.getPreferredLanguage() != null) {
                try {
                    org.caterfind.entity.Contact.Language.valueOf(contactDTO.getPreferredLanguage());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid preferredLanguage. Must be ENGLISH, HINDI, or GUJARATI"));
                }
            }
            
            ContactDTO created = contactService.createContact(catererId, contactDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ContactController] Error creating contact: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create contact: " + e.getMessage()));
        }
    }

    /**
     * Update an existing contact.
     * 
     * @param id         Contact ID
     * @param contactDTO Updated contact data
     * @return Updated ContactDTO or error response
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContact(
            @PathVariable Long id,
            @RequestBody ContactDTO contactDTO) {
        try {
            // Validate required fields
            if (contactDTO.getName() == null || contactDTO.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Contact name is required"));
            }
            
            if (contactDTO.getPhone() == null || contactDTO.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Phone number is required"));
            }
            
            ContactDTO updated = contactService.updateContact(id, contactDTO);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("[ContactController] Error updating contact: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update contact: " + e.getMessage()));
        }
    }

    /**
     * Delete a contact.
     * 
     * @param id Contact ID
     * @return 204 No Content if deleted, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        boolean deleted = contactService.deleteContact(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
