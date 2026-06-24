package com.GAKOM_ECOTACNA.ECOTACNA;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.GAKOM_ECOTACNA.ECOTACNA.config.LocalEnvLoader;

@SpringBootApplication
public class EcotacnaApplication {

	public static void main(String[] args) {
		LocalEnvLoader.loadEnv();
		String prop = System.getProperty("APIPERUDEV_API_TOKEN");
		String env = System.getenv("APIPERUDEV_API_TOKEN");
		System.out.println("EcotacnaApplication startup: System.getProperty(APIPERUDEV_API_TOKEN) = " + (prop != null ? prop.substring(Math.max(0, prop.length() - 4)) : "null"));
		System.out.println("EcotacnaApplication startup: System.getenv(APIPERUDEV_API_TOKEN) = " + (env != null ? env.substring(Math.max(0, env.length() - 4)) : "null"));
		SpringApplication.run(EcotacnaApplication.class, args);
	}
}
