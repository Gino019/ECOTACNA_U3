package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileSystemStorageService implements StorageService {

    private final Path rootLocation;

    public FileSystemStorageService() {
        this.rootLocation = Paths.get("uploads/evidencias");
    }

    @Override
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new BusinessException("No se pudo inicializar la carpeta de almacenamiento de evidencias: " + e.getMessage());
        }
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new BusinessException("El archivo de evidencia está vacío.");
            }
            String filename = StringUtils.cleanPath(file.getOriginalFilename());
            if (filename.contains("..")) {
                throw new BusinessException("No se puede almacenar archivo con ruta relativa: " + filename);
            }
            
            String extension = "";
            int i = filename.lastIndexOf('.');
            if (i > 0) {
                extension = filename.substring(i);
            }
            
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            Path destinationFile = this.rootLocation.resolve(Paths.get(uniqueFilename)).normalize().toAbsolutePath();
            
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new BusinessException("No se puede almacenar archivo fuera del directorio actual.");
            }
            
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
            
            return "/uploads/evidencias/" + uniqueFilename;
        } catch (IOException e) {
            throw new BusinessException("Fallo al almacenar el archivo de evidencia: " + e.getMessage());
        }
    }
}
