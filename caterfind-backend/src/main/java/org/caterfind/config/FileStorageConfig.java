package org.caterfind.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * File Storage Configuration
 * 
 * Configures Spring Boot to serve static files from the uploads directory.
 * This allows frontend to access images via URLs like:
 * http://localhost:8080/uploads/images/abc123.jpg
 */
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads/images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /uploads/** URLs to the upload directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/")
                .addResourceLocations("file:uploads/images/");
    }
}
