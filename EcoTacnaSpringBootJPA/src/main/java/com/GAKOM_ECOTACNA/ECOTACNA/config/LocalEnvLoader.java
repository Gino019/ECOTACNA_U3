package com.GAKOM_ECOTACNA.ECOTACNA.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class LocalEnvLoader {

    public static void loadEnv() {
        File envFile = new File(".env");
        System.out.println("LocalEnvLoader: envFile exists = " + envFile.exists() + " at " + envFile.getAbsolutePath());
        if (!envFile.exists()) {
            return;
        }
        
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                
                int separatorIndex = line.indexOf('=');
                if (separatorIndex > 0) {
                    String key = line.substring(0, separatorIndex).trim();
                    String value = line.substring(separatorIndex + 1).trim();
                    
                    System.out.println("LocalEnvLoader: Setting property " + key + " with value length " + value.length() + " ending in " + (value.length() >= 4 ? value.substring(value.length() - 4) : ""));
                    // Always set the system property to ensure local .env configuration takes precedence
                    System.setProperty(key, value);

                    // Also set relaxed dotted version of the key to override OS environment variables
                    String dottedKey = key.toLowerCase().replace('_', '.');
                    System.setProperty(dottedKey, value);

                    // Handle specific cases like base.url -> base-url
                    if (dottedKey.contains(".base.url")) {
                        System.setProperty(dottedKey.replace(".base.url", ".base-url"), value);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not read .env file. " + e.getMessage());
        }
    }
}
