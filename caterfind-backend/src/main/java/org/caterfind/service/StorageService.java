package org.caterfind.service;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String storeFile(MultipartFile file) throws IOException;
    boolean deleteFile(String fileUrl);
}