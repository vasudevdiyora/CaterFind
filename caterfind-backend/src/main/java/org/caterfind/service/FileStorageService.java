package org.caterfind.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * File Storage Service
 * 
 * Handles file uploads and storage on local server.
 * Files are stored in: ./uploads/images/
 * 
 * For production, this can be easily replaced with cloud storage (Cloudinary, S3, etc.)
 */
@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads/images}")
    private String uploadDir;

    /**
     * Store uploaded file and return the URL path
     * 
     * @param file MultipartFile from request
     * @return URL path to access the file (e.g., "/uploads/abc123.jpg")
     * @throws IOException if file storage fails
     */
    public String storeFile(MultipartFile file) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IOException("Failed to store empty file");
        }

        // Get original filename and validate
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        
        // Check for invalid characters in filename
        if (originalFilename.contains("..")) {
            throw new IOException("Filename contains invalid path sequence: " + originalFilename);
        }

        // Generate unique filename to avoid conflicts
        String fileExtension = getFileExtension(originalFilename);
        String newFilename = UUID.randomUUID().toString() + fileExtension;

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Copy file to the target location
        Path targetLocation = uploadPath.resolve(newFilename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // Return URL path (relative to server)
        return "/uploads/images/" + newFilename;
    }

    /**
     * Delete a file from storage
     * 
     * @param fileUrl URL path of the file (e.g., "/uploads/abc123.jpg")
     * @return true if deleted successfully
     */
    public boolean deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
                return false;
            }

            // Extract filename from URL
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).resolve(filename);

            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) {
            return "";
        }
        return filename.substring(lastDot);
    }
}
