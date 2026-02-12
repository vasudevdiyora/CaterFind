package org.caterfind.config;

import com.twilio.Twilio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

/**
 * Twilio Configuration
 * 
 * Initializes Twilio SDK with credentials from application.properties.
 * This allows the SmsService to send real SMS messages via Twilio API.
 */
@Configuration
public class TwilioConfig {

    @Value("${twilio.accountSid}")
    private String accountSid;

    @Value("${twilio.authToken}")
    private String authToken;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
        System.out.println("✅ Twilio initialized successfully");
    }
}
