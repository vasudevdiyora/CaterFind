package org.caterfind.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseSchemaFixer {

    @Bean
    public CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("🔧 Attempting to fix `messages` table schema...");
                // MySQL syntax to make valid
                jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN contact_id BIGINT NULL");
                System.out.println("✅ Successfully updated `messages.contact_id` to be NULLABLE.");
            } catch (Exception e) {
                System.out.println("⚠️ Schema update skipped or failed (might already be correct): " + e.getMessage());
            }
        };
    }
}
