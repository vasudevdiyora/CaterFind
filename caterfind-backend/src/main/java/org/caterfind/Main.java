package org.caterfind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Catering Business Management System.
 * 
 * This is a college project implementing a multi-role catering platform prototype.
 * 
 * SCOPE:
 * - Caterer operations (contacts, inventory, broadcast messaging, calendar)
 * - Client discovery and meeting-request workflows
 * - Admin panel APIs (dashboard, user management, moderation, settings)
 * 
 * INTENTIONALLY EXCLUDED (NOT BUGS):
 * - Full booking + payment execution pipeline
 * - Marketplace settlement and invoicing
 * - Production-grade analytics and BI
 * 
 * @author CaterFind Team
 * @version 1.0
 */
@SpringBootApplication
@EnableScheduling
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}