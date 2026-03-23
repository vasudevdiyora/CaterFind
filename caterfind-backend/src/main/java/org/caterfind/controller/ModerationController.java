package org.caterfind.controller;

import java.util.HashMap;
import java.util.Map;

import org.caterfind.entity.ModerationReport;
import org.caterfind.repository.ModerationReportRepository;
import org.caterfind.entity.User;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/moderation")
@CrossOrigin(origins = "*")
public class ModerationController {

    @Autowired
    private ModerationReportRepository moderationReportRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authentication required"));
            }

            String email = authentication.getName();
            User actor = userRepository.findByEmail(email).orElse(null);
            if (actor == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authenticated user not found"));
            }

            Object typeObj = payload.get("type");
            String typeStr = typeObj == null ? "MESSAGE" : typeObj.toString();
            Object contentObj = payload.get("content");
            String content = contentObj == null ? null : contentObj.toString();
            Object reportedUserObj = payload.get("reportedUser");
            String reportedUser = reportedUserObj == null ? null : reportedUserObj.toString();
            Object reasonObj = payload.get("reason");
            String reason = reasonObj == null ? null : reasonObj.toString();
            Long contentId = null;
            if (payload.get("contentId") instanceof Number) {
                contentId = ((Number) payload.get("contentId")).longValue();
            }
            String contentType = (String) payload.get("contentType");

            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "content is required"));
            }
            if (reportedUser == null || reportedUser.isBlank()) reportedUser = "unknown";
            if (reason == null || reason.isBlank()) reason = "other";

            ModerationReport.ReportType type = ModerationReport.ReportType.MESSAGE;
            try { type = ModerationReport.ReportType.valueOf(typeStr.toUpperCase()); } catch (Exception ignored) {}

            ModerationReport report = new ModerationReport();
            report.setType(type);
            report.setContent(content);
            report.setReportedBy(actor.getEmail());
            report.setReportedUser(reportedUser);
            report.setReason(reason);
            report.setContentId(contentId);
            report.setContentType(contentType);

            ModerationReport saved = moderationReportRepository.save(report);

            Map<String, Object> out = new HashMap<>();
            out.put("id", saved.getId());
            out.put("type", saved.getType().name().toLowerCase());
            out.put("content", saved.getContent());
            out.put("reportedBy", saved.getReportedBy());
            out.put("reportedUser", saved.getReportedUser());
            out.put("reason", saved.getReason());
            out.put("status", saved.getStatus().name().toLowerCase());
            out.put("timestamp", saved.getCreatedAt());
            out.put("contentId", saved.getContentId());
            out.put("contentType", saved.getContentType());

            return ResponseEntity.status(HttpStatus.CREATED).body(out);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
