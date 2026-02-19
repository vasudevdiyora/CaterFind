package org.caterfind.service;

import java.net.URI;
import java.net.URLEncoder;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;

@Service
@ConditionalOnProperty(name = "app.calling.provider", havingValue = "twilio", matchIfMissing = true)
public class TwilioCallService implements VoiceCallService {

    @Value("${twilio.phoneNumber}")
    private String from;

    @Value("${twilio.callbackUrl}")
    private String callbackUrl;

    @Override
    public void makeCall(String to, String message) throws Exception {
        URI uri = new URI(
                callbackUrl + "/twiml?msg=" +
                        URLEncoder.encode(message, "UTF-8"));

        Call.creator(
                new PhoneNumber(to),
                new PhoneNumber(from),
                uri).create();
    }
}
