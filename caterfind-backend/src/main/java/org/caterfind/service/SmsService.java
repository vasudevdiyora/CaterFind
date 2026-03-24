package org.caterfind.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

/**
 * SMS Service for sending text messages via Twilio.
 * 
 * This is a REAL implementation using Twilio API.
 * Requires valid Twilio credentials in application.properties.
 * 
 * The service sends SMS to contacts who have SMS as their preferred contact
 * method.
 */
@Service
public class SmsService {

    @org.springframework.beans.factory.annotation.Autowired
    private SettingsService settingsService;

    @Value("${twilio.phoneNumber}")
    private String fromNumber;

    /**
     * Send SMS to a phone number using Twilio API.
     * 
     * @param toPhone Recipient phone number (must include country code, e.g.,
     *                +919876543210)
     * @param message SMS message text
     * @return true if sent successfully, false otherwise
     */
    public boolean sendSms(String toPhone, String message) {
        if (!settingsService.isEnabled("smsEnabled")) {
            return false;
        }

        try {
            // Ensure phone number has country code
            String formattedPhone = toPhone.startsWith("+") ? toPhone : "+91" + toPhone;

            // Send SMS via Twilio
                Message.creator(
                    new PhoneNumber(formattedPhone),
                    new PhoneNumber(fromNumber),
                    message).create();

            return true;

        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
            return false;
        }
    }
}
