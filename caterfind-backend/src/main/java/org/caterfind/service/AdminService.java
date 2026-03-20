package org.caterfind.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.caterfind.entity.CateringProfile;
import org.caterfind.entity.ChatConversation;
import org.caterfind.entity.MeetingRequest;
import org.caterfind.entity.ModerationReport;
import org.caterfind.entity.ModerationReport.ReportStatus;
import org.caterfind.entity.PlatformSetting;
import org.caterfind.entity.User;
import org.caterfind.repository.ChatConversationRepository;
import org.caterfind.repository.MeetingRequestRepository;
import org.caterfind.repository.ModerationReportRepository;
import org.caterfind.repository.PlatformSettingRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MeetingRequestRepository meetingRequestRepository;

    @Autowired
    private ChatConversationRepository chatConversationRepository;

    @Autowired
    private ModerationReportRepository moderationReportRepository;

    @Autowired
    private PlatformSettingRepository platformSettingRepository;

    private static final Set<String> BOOLEAN_SETTING_KEYS = Set.of(
            "emailNotifications",
            "smsNotifications",
            "newUserNotification",
            "trialBookingNotification",
            "reportNotification",
            "allowRegistrations",
            "requireCatererApproval",
            "maintenanceMode",
            "enforceStrongPassword",
            "twoFactorAuth");

    private static final Set<String> NUMBER_SETTING_KEYS = Set.of(
            "commissionPercentage",
            "minimumCommission",
            "sessionTimeout");

    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
            "emailNotifications",
            "smsNotifications",
            "newUserNotification",
            "trialBookingNotification",
            "reportNotification",
            "allowRegistrations",
            "requireCatererApproval",
            "maintenanceMode",
            "commissionPercentage",
            "minimumCommission",
            "enforceStrongPassword",
            "twoFactorAuth",
            "sessionTimeout");

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardData() {
        List<User> users = userRepository.findAll();
        List<MeetingRequest> requests = meetingRequestRepository.findAll();
        List<ChatConversation> conversations = chatConversationRepository.findAll();

        long totalCaterers = users.stream().filter(u -> u.getRole() == User.UserRole.CATERER).count();
        long totalClients = users.stream().filter(u -> u.getRole() == User.UserRole.CLIENT).count();
        long newRegistrations = users.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(LocalDateTime.now().minusDays(7)))
                .count();
        long pendingApprovals = users.stream()
                .filter(u -> u.getRole() == User.UserRole.CATERER)
                .filter(u -> resolveAccountStatus(u) == User.AccountStatus.PENDING)
                .count();

        long scheduledTrials = requests.stream()
                .filter(r -> r.getStatus() == MeetingRequest.RequestStatus.ACCEPTED)
                .count();

        long flaggedContent = moderationReportRepository.countByStatus(ReportStatus.PENDING);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", users.size());
        stats.put("totalCaterers", totalCaterers);
        stats.put("totalClients", totalClients);
        stats.put("activeConversations", conversations.size());
        stats.put("scheduledTrials", scheduledTrials);
        stats.put("newRegistrations", newRegistrations);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("flaggedContent", flaggedContent);

        List<Map<String, Object>> recentActivity = buildRecentActivity(users, requests, conversations);

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("recentActivity", recentActivity);
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCaterers(String statusFilter) {
        String normalizedFilter = normalizeFilter(statusFilter);
        List<MeetingRequest> requests = meetingRequestRepository.findAll();

        Map<Long, Long> acceptedCountByCaterer = requests.stream()
                .filter(r -> r.getStatus() == MeetingRequest.RequestStatus.ACCEPTED)
                .filter(r -> r.getCaterer() != null)
                .collect(Collectors.groupingBy(r -> r.getCaterer().getId(), Collectors.counting()));

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.UserRole.CATERER)
                .filter(u -> "all".equals(normalizedFilter)
                        || resolveAccountStatus(u).name().equalsIgnoreCase(normalizedFilter))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(caterer -> {
                    CateringProfile profile = caterer.getCateringProfile();
                    String city = profile != null ? profile.getCity() : null;
                    String state = profile != null ? profile.getState() : null;
                    String area = profile != null ? profile.getArea() : null;
                    String businessName = profile != null && profile.getBusinessName() != null
                            ? profile.getBusinessName()
                            : caterer.getEmail();

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", caterer.getId());
                    row.put("businessName", businessName);
                    row.put("ownerName", profile != null && profile.getOwnerName() != null && !profile.getOwnerName().isBlank()
                            ? profile.getOwnerName()
                            : extractNameFromEmail(caterer.getEmail()));
                    row.put("email", caterer.getEmail());
                    row.put("phone", firstNonBlank(
                            profile != null ? profile.getPrimaryPhone() : null,
                            profile != null ? profile.getPhone() : null,
                            caterer.getPhone()));
                    row.put("location", buildLocation(area, city, state));
                    row.put("status", resolveAccountStatus(caterer).name().toLowerCase(Locale.ROOT));
                    row.put("rating", profile != null && profile.getRating() != null ? profile.getRating() : 0);
                    row.put("totalOrders", acceptedCountByCaterer.getOrDefault(caterer.getId(), 0L));
                    row.put("joinedDate", caterer.getCreatedAt());
                    row.put("specialties", Collections.emptyList());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateCatererStatus(Long catererId, String status) {
        User caterer = userRepository.findById(catererId)
                .orElseThrow(() -> new RuntimeException("Caterer not found"));

        if (caterer.getRole() != User.UserRole.CATERER) {
            throw new RuntimeException("Selected user is not a caterer");
        }

        User.AccountStatus accountStatus;
        try {
            accountStatus = User.AccountStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status: " + status);
        }

        caterer.setAccountStatus(accountStatus);
        userRepository.save(caterer);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", caterer.getId());
        response.put("status", accountStatus.name().toLowerCase(Locale.ROOT));
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClients() {
        List<MeetingRequest> requests = meetingRequestRepository.findAll();
        List<ChatConversation> conversations = chatConversationRepository.findAll();

        Map<Long, Long> trialsByClient = requests.stream()
                .filter(r -> r.getStatus() == MeetingRequest.RequestStatus.ACCEPTED)
                .filter(r -> r.getClient() != null)
                .collect(Collectors.groupingBy(r -> r.getClient().getId(), Collectors.counting()));

        Map<Long, Long> conversationsByClient = new HashMap<>();
        Map<Long, LocalDateTime> lastActiveByClient = new HashMap<>();

        for (ChatConversation conversation : conversations) {
            increment(conversationsByClient, conversation.getParticipant1Id());
            increment(conversationsByClient, conversation.getParticipant2Id());

            LocalDateTime lastMessageAt = conversation.getLastMessageAt();
            mergeMax(lastActiveByClient, conversation.getParticipant1Id(), lastMessageAt);
            mergeMax(lastActiveByClient, conversation.getParticipant2Id(), lastMessageAt);
        }

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.UserRole.CLIENT)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(client -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", client.getId());
                    row.put("name", firstNonBlank(client.getName(), extractNameFromEmail(client.getEmail())));
                    row.put("email", client.getEmail());
                    row.put("phone", firstNonBlank(client.getPhone(), "N/A"));
                    row.put("location", buildLocation(client.getArea(), client.getCity(), client.getState()));
                    row.put("joinedDate", client.getCreatedAt());
                    row.put("totalTrials", trialsByClient.getOrDefault(client.getId(), 0L));
                    row.put("activeConversations", conversationsByClient.getOrDefault(client.getId(), 0L));
                    row.put("lastActive", lastActiveByClient.getOrDefault(client.getId(), client.getCreatedAt()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getModerationReports(String statusFilter) {
        List<ModerationReport> reports;
        String normalizedFilter = normalizeFilter(statusFilter);

        if ("all".equals(normalizedFilter)) {
            reports = moderationReportRepository.findAllByOrderByCreatedAtDesc();
        } else {
            ReportStatus status;
            try {
                status = ReportStatus.valueOf(normalizedFilter.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new RuntimeException("Invalid moderation status: " + statusFilter);
            }
            reports = moderationReportRepository.findByStatusOrderByCreatedAtDesc(status);
        }

        return reports.stream().map(this::mapModerationReport).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateModerationStatus(Long reportId, String action) {
        ModerationReport report = moderationReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        String normalizedAction = action == null ? "" : action.trim().toLowerCase(Locale.ROOT);
        if ("approve".equals(normalizedAction) || "resolve".equals(normalizedAction) || "dismiss".equals(normalizedAction)) {
            report.setStatus(ReportStatus.RESOLVED);
        } else if ("remove".equals(normalizedAction)) {
            report.setStatus(ReportStatus.REMOVED);
        } else {
            throw new RuntimeException("Invalid moderation action: " + action);
        }

        ModerationReport saved = moderationReportRepository.save(report);
        return mapModerationReport(saved);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSettings() {
        Map<String, Object> settings = defaultSettings();

        for (PlatformSetting item : platformSettingRepository.findAll()) {
            String key = item.getSettingKey();
            if (!ALLOWED_SETTING_KEYS.contains(key)) {
                continue;
            }

            if (BOOLEAN_SETTING_KEYS.contains(key)) {
                settings.put(key, Boolean.parseBoolean(item.getSettingValue()));
            } else if (NUMBER_SETTING_KEYS.contains(key)) {
                try {
                    settings.put(key, Integer.parseInt(item.getSettingValue()));
                } catch (NumberFormatException ignored) {
                    // Keep default if stored data is invalid
                }
            }
        }

        return settings;
    }

    @Transactional
    public Map<String, Object> saveSettings(Map<String, Object> payload) {
        Map<String, Object> merged = getSettings();

        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            String key = entry.getKey();
            if (!ALLOWED_SETTING_KEYS.contains(key)) {
                continue;
            }

            Object normalizedValue = normalizeSettingValue(key, entry.getValue(), merged.get(key));
            merged.put(key, normalizedValue);

            PlatformSetting setting = platformSettingRepository.findBySettingKey(key)
                    .orElseGet(PlatformSetting::new);
            setting.setSettingKey(key);
            setting.setSettingValue(String.valueOf(normalizedValue));
            platformSettingRepository.save(setting);
        }

        return merged;
    }

    private List<Map<String, Object>> buildRecentActivity(
            List<User> users,
            List<MeetingRequest> requests,
            List<ChatConversation> conversations) {

        List<Map<String, Object>> activity = new ArrayList<>();

        users.stream()
                .filter(user -> user.getCreatedAt() != null)
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .limit(4)
                .forEach(user -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("type", user.getRole() == User.UserRole.CATERER ? "approval" : "registration");
                    row.put("user", user.getEmail() + " joined as " + user.getRole().name());
                    row.put("time", formatTimeAgo(user.getCreatedAt()));
                    row.put("at", user.getCreatedAt());
                    activity.add(row);
                });

        requests.stream()
                .filter(req -> req.getStatus() == MeetingRequest.RequestStatus.ACCEPTED)
                .filter(req -> req.getRespondedAt() != null)
                .sorted(Comparator.comparing(MeetingRequest::getRespondedAt).reversed())
                .limit(2)
                .forEach(req -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("type", "trial");
                    row.put("user", req.getClient().getEmail() + " request accepted by " + req.getCaterer().getEmail());
                    row.put("time", formatTimeAgo(req.getRespondedAt()));
                    row.put("at", req.getRespondedAt());
                    activity.add(row);
                });

        conversations.stream()
                .filter(conversation -> conversation.getLastMessageAt() != null)
                .sorted(Comparator.comparing(ChatConversation::getLastMessageAt).reversed())
                .limit(2)
                .forEach(conversation -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("type", "message");
                    row.put("user", "Conversation between users " + conversation.getParticipant1Id() + " and " + conversation.getParticipant2Id());
                    row.put("time", formatTimeAgo(conversation.getLastMessageAt()));
                    row.put("at", conversation.getLastMessageAt());
                    activity.add(row);
                });

        List<Map<String, Object>> sorted = activity.stream()
                .sorted((a, b) -> ((LocalDateTime) b.get("at")).compareTo((LocalDateTime) a.get("at")))
                .limit(8)
                .map(item -> {
                    Map<String, Object> responseRow = new LinkedHashMap<>();
                    responseRow.put("type", item.get("type"));
                    responseRow.put("user", item.get("user"));
                    responseRow.put("time", item.get("time"));
                    return responseRow;
                })
                .collect(Collectors.toList());

        for (int i = 0; i < sorted.size(); i++) {
            sorted.get(i).put("id", i + 1L);
        }

        return sorted;
    }

    private Map<String, Object> mapModerationReport(ModerationReport report) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", report.getId());
        row.put("type", report.getType().name().toLowerCase(Locale.ROOT));
        row.put("content", report.getContent());
        row.put("reportedBy", report.getReportedBy());
        row.put("reportedUser", report.getReportedUser());
        row.put("reason", report.getReason());
        row.put("status", report.getStatus().name().toLowerCase(Locale.ROOT));
        row.put("timestamp", report.getCreatedAt());
        return row;
    }

    private String normalizeFilter(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return "all";
        }
        return statusFilter.trim().toLowerCase(Locale.ROOT);
    }

    private User.AccountStatus resolveAccountStatus(User user) {
        return user.getAccountStatus() == null ? User.AccountStatus.ACTIVE : user.getAccountStatus();
    }

    private String buildLocation(String area, String city, String state) {
        List<String> parts = new ArrayList<>();
        if (area != null && !area.isBlank()) {
            parts.add(area.trim());
        }
        if (city != null && !city.isBlank()) {
            parts.add(city.trim());
        }
        if (state != null && !state.isBlank()) {
            parts.add(state.trim());
        }
        if (parts.isEmpty()) {
            return "N/A";
        }
        return String.join(", ", parts);
    }

    private String extractNameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "Unknown";
        }
        String prefix = email.substring(0, email.indexOf('@')).replace('.', ' ').replace('_', ' ').trim();
        if (prefix.isBlank()) {
            return "Unknown";
        }
        String[] words = prefix.split("\\s+");
        return java.util.Arrays.stream(words)
                .filter(word -> !word.isBlank())
                .map(word -> Character.toUpperCase(word.charAt(0)) + word.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "N/A";
    }

    private String formatTimeAgo(LocalDateTime timestamp) {
        if (timestamp == null) {
            return "Unknown";
        }

        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(timestamp, now);
        if (minutes < 1) {
            return "Just now";
        }
        if (minutes < 60) {
            return minutes + " minute" + (minutes == 1 ? "" : "s") + " ago";
        }

        long hours = ChronoUnit.HOURS.between(timestamp, now);
        if (hours < 24) {
            return hours + " hour" + (hours == 1 ? "" : "s") + " ago";
        }

        long days = ChronoUnit.DAYS.between(timestamp, now);
        return days + " day" + (days == 1 ? "" : "s") + " ago";
    }

    private void increment(Map<Long, Long> map, Long key) {
        if (key == null) {
            return;
        }
        map.put(key, map.getOrDefault(key, 0L) + 1L);
    }

    private void mergeMax(Map<Long, LocalDateTime> map, Long key, LocalDateTime value) {
        if (key == null || value == null) {
            return;
        }
        map.merge(key, value, (oldValue, newValue) -> oldValue.isAfter(newValue) ? oldValue : newValue);
    }

    private Object normalizeSettingValue(String key, Object incomingValue, Object fallback) {
        if (BOOLEAN_SETTING_KEYS.contains(key)) {
            if (incomingValue instanceof Boolean) {
                return incomingValue;
            }
            if (incomingValue instanceof String) {
                return Boolean.parseBoolean((String) incomingValue);
            }
            return Objects.requireNonNullElse(fallback, false);
        }

        if (NUMBER_SETTING_KEYS.contains(key)) {
            if (incomingValue instanceof Number) {
                return ((Number) incomingValue).intValue();
            }
            if (incomingValue instanceof String) {
                try {
                    return Integer.parseInt((String) incomingValue);
                } catch (NumberFormatException ignored) {
                    return Objects.requireNonNullElse(fallback, 0);
                }
            }
            return Objects.requireNonNullElse(fallback, 0);
        }

        return incomingValue;
    }

    private Map<String, Object> defaultSettings() {
        Map<String, Object> defaults = new LinkedHashMap<>();

        defaults.put("emailNotifications", true);
        defaults.put("smsNotifications", false);
        defaults.put("newUserNotification", true);
        defaults.put("trialBookingNotification", true);
        defaults.put("reportNotification", true);

        defaults.put("allowRegistrations", true);
        defaults.put("requireCatererApproval", true);
        defaults.put("maintenanceMode", false);

        defaults.put("commissionPercentage", 10);
        defaults.put("minimumCommission", 100);

        defaults.put("enforceStrongPassword", true);
        defaults.put("twoFactorAuth", false);
        defaults.put("sessionTimeout", 30);

        return defaults;
    }
}
