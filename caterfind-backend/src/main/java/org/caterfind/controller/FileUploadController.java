package org.caterfind.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.caterfind.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * File Upload Controller
 * 
 * Handles image/video uploads for:
 * - Business photos (MyBusiness page)
 * - Dish photos (Dish Library)
 * - Profile pictures
 * 
 * Returns the URL path where the file is accessible.
 */
@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class FileUploadController {
    
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
    private static final long WARN_DISK_SPACE = 500 * 1024 * 1024; // 500MB warning

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Upload single image/video file
     * 
     * POST /api/files/upload
     * Body: multipart/form-data with "file" field
     * 
     * Returns: { "url": "/uploads/images/abc123.jpg" }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Check if file is empty
            if (file == null || file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Validate file size
            if (file.getSize() > MAX_FILE_SIZE) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File size exceeds 100MB limit");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only image and video files are allowed");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // Check available disk space
            java.io.File uploadDir = new java.io.File("uploads");
            long availableSpace = uploadDir.getFreeSpace();
            if (availableSpace < file.getSize() * 2) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Server storage full");
                logger.warn("Low disk space: {} bytes available", availableSpace);
                return ResponseEntity.status(HttpStatus.INSUFFICIENT_STORAGE).body(error);
            }
            
            if (availableSpace < WARN_DISK_SPACE) {
                logger.warn("Disk space warning: only {} bytes available", availableSpace);
            }

            // Store file and get URL
            String fileUrl = fileStorageService.storeFile(file);

            // Return URL in response
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            logger.error("Failed to upload file", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            logger.error("Unexpected error during file upload", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Delete uploaded file
     * 
     * DELETE /api/files?url=/uploads/images/abc123.jpg
     * 
     * SECURITY: Validates file path doesn't contain path traversal sequences
     */
    @DeleteMapping
    public ResponseEntity<?> deleteFile(@RequestParam("url") String fileUrl) {
        try {
            // Validate URL to prevent path traversal attacks
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File URL is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // SECURITY: Must start with /uploads/ to prevent directory traversal
            if (!fileUrl.startsWith("/uploads/") && !fileUrl.startsWith("uploads/")) {
                logger.warn("Path traversal attempt detected: {}", fileUrl);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid file path");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            // SECURITY: Must not contain .. (parent directory references)
            if (fileUrl.contains("..") || fileUrl.contains("\\")) {
                logger.warn("Path traversal characters detected in: {}", fileUrl);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid file path");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            boolean deleted = fileStorageService.deleteFile(fileUrl);
            
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "File deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File not found or already deleted");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            logger.error("Failed to delete file: {}", fileUrl, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
