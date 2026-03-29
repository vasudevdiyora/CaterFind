package org.caterfind.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;

import org.caterfind.dto.ContactDTO;
import org.caterfind.entity.Contact;
import org.caterfind.entity.ContactLabel;
import org.caterfind.repository.ContactLabelRepository;
import org.caterfind.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contact service for managing caterer's contacts.
 * 
 * Handles CRUD operations for contacts with label management.
 * 
 * Labels are flexible to support real catering workflow:
 * - A person can have multiple labels (e.g., "Chef" + "Staff")
 * - Labels: Staff, Chef, Helper, Supplier, Dealer
 * 
 * IMPORTANT: These are NOT client event contacts.
 * These are internal contacts for caterer coordination.
 */
@Service
@Transactional
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private ContactLabelRepository contactLabelRepository;

    @Autowired
    private EntityManager entityManager;

    /**
     * Get all contacts for a caterer.
     * Converts entities to DTOs with label names.
     * 
     * @param catererId User ID of the caterer
     * @return List of ContactDTOs
     */
    public List<ContactDTO> getAllContacts(Long catererId) {
        List<Contact> contacts = contactRepository.findByCatererId(catererId);
        return contacts.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single contact by ID.
     * 
     * @param contactId Contact ID
     * @return ContactDTO or null if not found
     */
    public ContactDTO getContactById(Long contactId) {
        return contactRepository.findById(contactId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    /**
     * Create a new contact.
     * Assigns labels based on label names in DTO.
     * 
     * @param catererId  User ID of the caterer
     * @param contactDTO Contact data
     * @return Created ContactDTO
     */
    public ContactDTO createContact(Long catererId, ContactDTO contactDTO) {
        Contact contact = new Contact();
        contact.setCatererId(catererId);
        contact.setName(contactDTO.getName());
        contact.setPhone(contactDTO.getPhone());
        contact.setEmail(contactDTO.getEmail());
        
        // Set preferred contact method with default fallback
        if (contactDTO.getPreferredContactMethod() != null && !contactDTO.getPreferredContactMethod().isEmpty()) {
            contact.setPreferredContactMethod(
                Contact.ContactMethod.valueOf(contactDTO.getPreferredContactMethod()));
        } else {
            contact.setPreferredContactMethod(Contact.ContactMethod.EMAIL);
        }
        
        // Set preferred language (default to ENGLISH if not provided)
        if (contactDTO.getPreferredLanguage() != null && !contactDTO.getPreferredLanguage().isEmpty()) {
            contact.setPreferredLanguage(
                Contact.Language.valueOf(contactDTO.getPreferredLanguage()));
        } else {
            contact.setPreferredLanguage(Contact.Language.ENGLISH);
        }

        // Assign labels. Missing labels are created so production does not depend on seed SQL.
        if (contactDTO.getLabels() != null && !contactDTO.getLabels().isEmpty()) {
            contact.setLabels(resolveLabels(contactDTO.getLabels()));
        }

        Contact saved = contactRepository.save(contact);
        return convertToDTO(saved);
    }

    /**
     * Update an existing contact.
     * 
     * @param contactId  Contact ID
     * @param contactDTO Updated contact data
     * @return Updated ContactDTO or null if not found
     */
    public ContactDTO updateContact(Long contactId, ContactDTO contactDTO) {
        return contactRepository.findById(contactId)
                .map(contact -> {
                    contact.setName(contactDTO.getName());
                    contact.setPhone(contactDTO.getPhone());
                    contact.setEmail(contactDTO.getEmail());
                    
                    // Set preferred contact method with default fallback
                    if (contactDTO.getPreferredContactMethod() != null && !contactDTO.getPreferredContactMethod().isEmpty()) {
                        contact.setPreferredContactMethod(
                            Contact.ContactMethod.valueOf(contactDTO.getPreferredContactMethod()));
                    } else {
                        contact.setPreferredContactMethod(Contact.ContactMethod.EMAIL);
                    }
                    
                    // Update preferred language
                    if (contactDTO.getPreferredLanguage() != null && !contactDTO.getPreferredLanguage().isEmpty()) {
                        contact.setPreferredLanguage(
                            Contact.Language.valueOf(contactDTO.getPreferredLanguage()));
                    } else {
                        contact.setPreferredLanguage(Contact.Language.ENGLISH);
                    }

                    // Update labels. Missing labels are created so production does not depend on seed SQL.
                    if (contactDTO.getLabels() != null) {
                        contact.setLabels(resolveLabels(contactDTO.getLabels()));
                    }

                    Contact updated = contactRepository.save(contact);
                    return convertToDTO(updated);
                })
                .orElse(null);
    }

    /**
     * Delete a contact.
     * 
     * @param contactId Contact ID
     * @return true if deleted, false if not found
     */
    public boolean deleteContact(Long contactId) {
        if (contactRepository.existsById(contactId)) {
            contactRepository.deleteById(contactId);
            return true;
        }
        return false;
    }

    /**
     * Convert Contact entity to ContactDTO.
     * Extracts label names for frontend display.
     * 
     * @param contact Contact entity
     * @return ContactDTO
     */
    private ContactDTO convertToDTO(Contact contact) {
        List<String> labelNames = contact.getLabels().stream()
                .map(ContactLabel::getLabelName)
                .collect(Collectors.toList());

        return new ContactDTO(
                contact.getId(),
                contact.getName(),
                contact.getPhone(),
                contact.getEmail(),
                contact.getPreferredContactMethod().name(),
                contact.getPreferredLanguage() != null ? contact.getPreferredLanguage().name() : "ENGLISH",
                labelNames);
    }

    private Set<ContactLabel> resolveLabels(List<String> labelNames) {
        Set<ContactLabel> labels = new HashSet<>();
        for (String labelName : labelNames) {
            ContactLabel label = resolveOrCreateLabel(labelName);
            if (label != null) {
                labels.add(label);
            }
        }
        return labels;
    }

    private ContactLabel resolveOrCreateLabel(String rawLabelName) {
        if (rawLabelName == null) {
            return null;
        }

        String normalized = rawLabelName.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        ContactLabel label = contactLabelRepository.findByLabelName(normalized)
                .or(() -> contactLabelRepository.findByLabelNameIgnoreCase(normalized))
                .orElseGet(() -> contactLabelRepository.save(new ContactLabel(normalized)));

        return entityManager.merge(label);
    }
}
