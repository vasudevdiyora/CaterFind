package org.caterfind.config;

import org.caterfind.entity.User;
import org.caterfind.entity.User.AccountStatus;
import org.caterfind.entity.User.UserRole;
import org.caterfind.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole(UserRole.ADMIN)) {
            logger.info("Admin already exists");
            return;
        }

        String email = adminEmail == null ? "" : adminEmail.trim();
        String password = adminPassword == null ? "" : adminPassword;

        if (email.isEmpty() || password.isEmpty()) {
            logger.warn("Admin seeding skipped: app.admin.email or app.admin.password is empty");
            return;
        }

        if (userRepository.existsByEmail(email)) {
            logger.warn("Admin seeding skipped: user with configured app.admin.email already exists");
            return;
        }

        User admin = new User();
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(UserRole.ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);

        userRepository.save(admin);
        logger.info("Admin created successfully");
    }
}
