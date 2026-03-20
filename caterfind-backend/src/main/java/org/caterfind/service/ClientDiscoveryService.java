package org.caterfind.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.caterfind.entity.CateringProfile;
import org.caterfind.entity.ClientShortlist;
import org.caterfind.entity.User;
import org.caterfind.repository.CateringProfileRepository;
import org.caterfind.repository.ClientShortlistRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientDiscoveryService {

    @Autowired
    private ClientShortlistRepository clientShortlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CateringProfileRepository cateringProfileRepository;

    @Transactional(readOnly = true)
    public List<Long> getShortlistedCatererIds(Long clientId) {
        return clientShortlistRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(item -> item.getCaterer().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> addToShortlist(Long clientId, Long catererId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        User caterer = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("Caterer not found"));

        if (client.getRole() != User.UserRole.CLIENT) {
            throw new RuntimeException("Only clients can manage shortlist");
        }
        if (caterer.getRole() != User.UserRole.CATERER) {
            throw new RuntimeException("Only caterers can be shortlisted");
        }

        if (!clientShortlistRepository.existsByClientIdAndCatererId(clientId, catererId)) {
            ClientShortlist row = new ClientShortlist();
            row.setClient(client);
            row.setCaterer(caterer);
            clientShortlistRepository.save(row);
        }

        return Map.of(
                "success", true,
                "catererId", catererId,
                "shortlistedIds", getShortlistedCatererIds(clientId));
    }

    @Transactional
    public Map<String, Object> removeFromShortlist(Long clientId, Long catererId) {
        clientShortlistRepository.deleteByClientIdAndCatererId(clientId, catererId);

        return Map.of(
                "success", true,
                "catererId", catererId,
                "shortlistedIds", getShortlistedCatererIds(clientId));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchCaterers(
            Long clientId,
            String q,
            String city,
            String area,
            Double minRating,
            Integer minServiceRadius,
            Double lat,
            Double lng,
            String sortBy) {

        String query = normalize(q);
        String cityFilter = normalize(city);
        String areaFilter = normalize(area);
        String sort = normalize(sortBy);
        double minRatingValue = minRating == null ? 0.0 : minRating;
        int minRadiusValue = minServiceRadius == null ? 0 : minServiceRadius;
        boolean hasClientCoordinates = lat != null && lng != null;

        Set<Long> shortlistSet = new HashSet<>(getShortlistedCatererIds(clientId));

        List<Map<String, Object>> rows = new ArrayList<>();

        for (CateringProfile profile : cateringProfileRepository.findAll()) {
            if (profile.getUser() == null || profile.getUser().getRole() != User.UserRole.CATERER) {
                continue;
            }

            String businessName = safe(profile.getBusinessName());
            String profileCity = safe(profile.getCity());
            String profileArea = safe(profile.getArea());
            String description = safe(profile.getDescription());
            Double profileRating = profile.getRating();
            Integer profileServiceRadius = profile.getServiceRadius();
            double rating = profileRating != null ? profileRating : 0.0;
            int serviceRadius = profileServiceRadius != null ? profileServiceRadius : 0;

            boolean queryMatch = query.isEmpty()
                    || businessName.toLowerCase(Locale.ROOT).contains(query)
                    || profileCity.toLowerCase(Locale.ROOT).contains(query)
                    || profileArea.toLowerCase(Locale.ROOT).contains(query)
                    || description.toLowerCase(Locale.ROOT).contains(query);

            boolean cityMatch = cityFilter.isEmpty() || profileCity.equalsIgnoreCase(cityFilter);
            boolean areaMatch = areaFilter.isEmpty() || profileArea.equalsIgnoreCase(areaFilter);
            boolean ratingMatch = rating >= minRatingValue;
            boolean radiusMatch = serviceRadius >= minRadiusValue;

            if (!(queryMatch && cityMatch && areaMatch && ratingMatch && radiusMatch)) {
                continue;
            }

            Double distanceKm = null;
            if (hasClientCoordinates && profile.getLatitude() != null && profile.getLongitude() != null) {
                distanceKm = haversineKm(lat, lng, profile.getLatitude(), profile.getLongitude());
            }

            double relevanceScore = computeRelevanceScore(
                    query,
                    businessName,
                    profileCity,
                    profileArea,
                    description,
                    rating,
                    shortlistSet.contains(profile.getUser().getId()),
                    distanceKm);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", profile.getId());
            row.put("userId", profile.getUser().getId());
            row.put("businessName", profile.getBusinessName());
            row.put("description", profile.getDescription());
            row.put("area", profile.getArea());
            row.put("city", profile.getCity());
            row.put("state", profile.getState());
            row.put("serviceRadius", profile.getServiceRadius());
            row.put("rating", profile.getRating());
            row.put("imageUrl", profile.getImageUrl());
            row.put("latitude", profile.getLatitude());
            row.put("longitude", profile.getLongitude());
            row.put("distanceKm", distanceKm);
            row.put("isShortlisted", shortlistSet.contains(profile.getUser().getId()));
            row.put("relevanceScore", relevanceScore);
            rows.add(row);
        }

        Comparator<Map<String, Object>> comparator = switch (sort) {
            case "rating_high" -> Comparator.comparing(
                item -> toDouble(item.get("rating")),
                Comparator.reverseOrder());
            case "rating_low" -> Comparator.comparing(item -> toDouble(item.get("rating")));
            case "name_asc" -> Comparator.comparing(
                item -> safe((String) item.get("businessName")),
                String.CASE_INSENSITIVE_ORDER);
            case "name_desc" -> Comparator.comparing(
                item -> safe((String) item.get("businessName")),
                String.CASE_INSENSITIVE_ORDER.reversed());
            case "distance" -> Comparator.comparing(item -> distanceSortValue(item.get("distanceKm")));
            default -> Comparator.comparing(
                item -> toDouble(item.get("relevanceScore")),
                Comparator.reverseOrder());
        };

        return rows.stream()
                .sorted(comparator.thenComparing(item -> safe((String) item.get("businessName")), String.CASE_INSENSITIVE_ORDER))
                .peek(item -> item.remove("relevanceScore"))
                .collect(Collectors.toList());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0.0;
    }

    private double distanceSortValue(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.MAX_VALUE;
    }

    private double computeRelevanceScore(
            String query,
            String businessName,
            String city,
            String area,
            String description,
            double rating,
            boolean shortlisted,
            Double distanceKm) {

        double score = rating / 5.0;

        if (!query.isEmpty()) {
            String q = query.toLowerCase(Locale.ROOT);
            if (businessName.toLowerCase(Locale.ROOT).contains(q)) score += 3.0;
            if (city.toLowerCase(Locale.ROOT).contains(q) || area.toLowerCase(Locale.ROOT).contains(q)) score += 2.0;
            if (description.toLowerCase(Locale.ROOT).contains(q)) score += 1.0;
        }

        if (shortlisted) {
            score += 0.5;
        }

        if (distanceKm != null) {
            score += Math.max(0.0, 2.0 - (distanceKm / 10.0));
        }

        return score;
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}
