package org.caterfind.controller;

import org.caterfind.dto.ContactDTO;
import org.caterfind.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
@CrossOrigin(origins = "*")
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
     * @return Created ContactDTO
     */
    @PostMapping
    public ResponseEntity<ContactDTO> createContact(
            @RequestParam Long catererId,
            @RequestBody ContactDTO contactDTO) {
        ContactDTO created = contactService.createContact(catererId, contactDTO);
        return ResponseEntity.ok(created);
    }

    /**
     * Update an existing contact.
     * 
     * @param id         Contact ID
     * @param contactDTO Updated contact data
     * @return Updated ContactDTO or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<ContactDTO> updateContact(
            @PathVariable Long id,
            @RequestBody ContactDTO contactDTO) {
        ContactDTO updated = contactService.updateContact(id, contactDTO);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
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
