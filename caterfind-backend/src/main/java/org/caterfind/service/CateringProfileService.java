package org.caterfind.service;

import org.caterfind.dto.CateringProfileDTO;
import org.caterfind.entity.CateringProfile;
import org.caterfind.entity.User;
import org.caterfind.repository.CateringProfileRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing catering business profiles.
 */
@Service
public class CateringProfileService {

    @Autowired
    private CateringProfileRepository cateringProfileRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get catering profile by user ID.
     *
     * @param userId User ID of the caterer
     * @return CateringProfileDTO with business details
     */
    public CateringProfileDTO getProfile(Long userId) {
        Optional<CateringProfile> profileOpt = cateringProfileRepository.findByUserId(userId);

        if (profileOpt.isEmpty()) {
            return null; // Or throw exception / return empty DTO
        }

        return mapToDTO(profileOpt.get());
    }

    /**
     * Update catering profile for a user.
     * Creates new profile if one doesn't exist.
     *
     * @param userId User ID of the caterer
     * @param dto    Updated profile data
     * @return Updated CateringProfileDTO
     */
    @Transactional
    public CateringProfileDTO updateProfile(Long userId, CateringProfileDTO dto) {
        CateringProfile profile = cateringProfileRepository.findByUserId(userId)
                .orElse(new CateringProfile());

        if (profile.getUser() == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            profile.setUser(user);
            profile.setCreatedAt(LocalDateTime.now());
        }

        // Map DTO fields to Entity
        profile.setBusinessName(dto.getBusinessName());
        profile.setDescription(dto.getDescription());
        profile.setPrimaryPhone(dto.getPrimaryPhone());
        profile.setAlternatePhone(dto.getAlternatePhone());
        profile.setEmail(dto.getEmail());
        profile.setStreetAddress(dto.getStreetAddress());
        profile.setArea(dto.getArea());
        profile.setCity(dto.getCity());
        profile.setLandmark(dto.getLandmark());
        profile.setServiceRadius(dto.getServiceRadius());

        // Sync legacy fields for backward compatibility
        profile.setPhone(dto.getPrimaryPhone());
        String fullAddress = (dto.getStreetAddress() + ", " + dto.getArea() + ", " + dto.getCity())
                .replaceAll("null", "")
                .replaceAll(", ,", ",")
                .trim();
        if (fullAddress.startsWith(", "))
            fullAddress = fullAddress.substring(2);
        if (fullAddress.endsWith(","))
            fullAddress = fullAddress.substring(0, fullAddress.length() - 1);
        profile.setAddress(fullAddress);

        CateringProfile savedProfile = cateringProfileRepository.save(profile);
        return mapToDTO(savedProfile);
    }

    // Helper to map Entity to DTO
    private CateringProfileDTO mapToDTO(CateringProfile entity) {
        CateringProfileDTO dto = new CateringProfileDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser().getId());
        dto.setBusinessName(entity.getBusinessName());
        dto.setDescription(entity.getDescription());
        dto.setPrimaryPhone(entity.getPrimaryPhone());
        dto.setAlternatePhone(entity.getAlternatePhone());
        dto.setEmail(entity.getEmail());
        dto.setStreetAddress(entity.getStreetAddress());
        dto.setArea(entity.getArea());
        dto.setCity(entity.getCity());
        dto.setLandmark(entity.getLandmark());
        dto.setServiceRadius(entity.getServiceRadius());
        return dto;
    }
}
