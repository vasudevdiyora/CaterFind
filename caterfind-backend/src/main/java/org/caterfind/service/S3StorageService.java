package org.caterfind.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    public S3StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String storeFile(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String cleanName = original != null ? original.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : "file";
        String fileName = UUID.randomUUID() + "-" + cleanName;

        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .build(),
            RequestBody.fromBytes(file.getBytes())
        );

        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileName;
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            String key = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

            s3Client.deleteObject(
                DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build()
            );

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}