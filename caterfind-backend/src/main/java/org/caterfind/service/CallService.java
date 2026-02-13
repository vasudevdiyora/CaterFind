package org.caterfind.service;

import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;

@Service
public class CallService {

    @Value("${twilio.phoneNumber}")
    private String from;

    @Value("${twilio.callbackUrl}")
    private String callbackUrl;

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
