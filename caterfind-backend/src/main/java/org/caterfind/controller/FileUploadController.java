package org.caterfind.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.caterfind.service.FileStorageService;
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
@CrossOrigin(origins = "*")
public class FileUploadController {

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
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only image and video files are allowed");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Store file and get URL
            String fileUrl = fileStorageService.storeFile(file);

            // Return URL in response
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Delete uploaded file
     * 
     * DELETE /api/files?url=/uploads/images/abc123.jpg
     */
    @DeleteMapping
    public ResponseEntity<?> deleteFile(@RequestParam("url") String fileUrl) {
        boolean deleted = fileStorageService.deleteFile(fileUrl);
        
        if (deleted) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
