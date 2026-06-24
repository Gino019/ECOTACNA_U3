package com.GAKOM_ECOTACNA.ECOTACNA.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    void init();
    String store(MultipartFile file);
}
