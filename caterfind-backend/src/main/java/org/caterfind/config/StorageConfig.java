package org.caterfind.config;

import org.caterfind.service.LocalStorageService;
import org.caterfind.service.S3StorageService;
import org.caterfind.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {

    @Value("${storage.type:local}")
    private String storageType;

    @Bean
    public StorageService storageService(
            LocalStorageService localService,
            S3StorageService s3Service) {

        if ("s3".equalsIgnoreCase(storageType)) {
            return s3Service;
        }
        return localService;
    }
}