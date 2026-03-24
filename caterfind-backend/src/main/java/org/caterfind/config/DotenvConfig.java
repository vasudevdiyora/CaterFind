package org.caterfind.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import io.github.cdimascio.dotenv.Dotenv;

/**
 * Loads environment variables from .env file before Spring Boot starts.
 * This allows Spring Boot to access .env variables using ${ENV_VAR} syntax.
 */
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            // Load .env file from the root of the project
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing() // Don't fail if .env doesn't exist (prod environments)
                    .load();

            // Convert dotenv entries to a Map
            Map<String, Object> dotenvMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                dotenvMap.put(entry.getKey(), entry.getValue());
            });

            // Add dotenv properties to Spring Environment
            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            environment.getPropertySources().addFirst(
                    new MapPropertySource("dotenvProperties", dotenvMap)
            );

            // System.out.println("✓ Successfully loaded .env file with " + dotenvMap.size() + " variables");

        } catch (Exception e) {
            System.err.println("⚠ Warning: Could not load .env file: " + e.getMessage());
            System.err.println("  Make sure you have created a .env file in the backend root directory.");
            System.err.println("  Copy .env.example to .env and fill in your credentials.");
        }
    }
}
