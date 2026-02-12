package org.caterfind.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email Service for sending emails via JavaMail.
 * 
 * This is a REAL implementation using Spring Boot Mail Starter.
 * Requires valid SMTP configuration in application.properties.
 * 
 * The service sends emails to contacts who have EMAIL as their preferred
 * contact method.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send email to a recipient using JavaMail.
     * 
     * @param toEmail Recipient email address
     * @param subject Email subject
     * @param body    Email body/message
     * @return true if sent successfully, false otherwise
     */
    public boolean sendEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(fromEmail);
            email.setTo(toEmail);
            email.setSubject(subject);
            email.setText(body);

            mailSender.send(email);

            System.out.println("📧 EMAIL SENT via JavaMail");
            System.out.println("From: " + fromEmail);
            System.out.println("To: " + toEmail);
            System.out.println("Subject: " + subject);

            return true;

        } catch (Exception e) {
            System.err.println("❌ Failed to send email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
