package org.caterfind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Catering Business Management System.
 * 
 * This is a COLLEGE PROJECT implementing CATERER-SIDE ONLY functionality.
 * 
 * SCOPE:
 * - Contact management (staff, suppliers, dealers)
 * - Broadcast messaging (email/SMS stubs)
 * - Inventory tracking with low-stock alerts
 * 
 * INTENTIONALLY EXCLUDED (NOT BUGS):
 * - Client dashboard (clients can only login)
 * - Online booking, payments, packages
 * - Event management
 * - Real-time chat (messaging is broadcast-only)
 * - Analytics, charts, calendars
 * 
 * @author CaterFind Team
 * @version 1.0
 */
@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}