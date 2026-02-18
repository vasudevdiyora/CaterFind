package org.caterfind.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@ConditionalOnProperty(name = "app.calling.provider", havingValue = "exotel")
public class ExotelCallService implements VoiceCallService {

    @Value("${exotel.sid}")
    private String sid;

    @Value("${exotel.apiKey}")
    private String apiKey;

    @Value("${exotel.token}")
    private String token;

    @Value("${exotel.subdomain}")
    private String subdomain;

    @Value("${exotel.callerId}")
    private String callerId;

    // Optional: ID of an applet to connect to.
    // If you just want to "say" something, you typically need to connect to an
    // applet that reads a variable,
    // or use a specific "Call" flow.
    // For this implementation, we'll hit the 'Connect' endpoint which links two
    // numbers (or a number and an applet).
    @Value("${exotel.appletId:}")
    private String appletId;

    private final HttpClient httpClient = HttpClient.newBuilder().version(HttpClient.Version.HTTP_2).build();

    @Override
    public void makeCall(String to, String message) throws Exception {
        // Exotel API Endpoint
        String hostname = subdomain;
        if (!hostname.contains(".")) {
            hostname = hostname + ".exotel.com";
        }
        String url = String.format("https://%s/v1/Accounts/%s/Calls/connect", hostname, sid);

        System.out.println("🔗 Exotel URL: " + url); // Debug log

        // Prepare Form Data
        StringBuilder formData = new StringBuilder();
        formData.append("From=").append(URLEncoder.encode(to, StandardCharsets.UTF_8));
        formData.append("&To=").append(URLEncoder.encode(callerId, StandardCharsets.UTF_8));
        formData.append("&CallerId=").append(URLEncoder.encode(callerId, StandardCharsets.UTF_8));
        formData.append("&CallType=").append("trans");

        // If appletId is provided, use it as the flow to connect to
        if (appletId != null && !appletId.isEmpty()) {
            // Example: Using Exotel's Url parameter to trigger a flow or return XML
            // For now, we just pass it if configured.
            // Note: Exotel's Url parameter expects a URL that returns TwiML/ExoML.
            // If we want to simulate "Saying a message", we can point to our backend /twiml
            // endpoint!
            // That endpoint returns <Say>Message</Say>. Exotel supports <Say> via Passthru
            // or similar.
            // But for standard "Connect", usually 'Url' is executed when the call connects.

            // Let's attempt to use our existing callback if we can find it.
            // But simpler to just connect for now as requested.
        }

        // Create Basic Auth Header
        // Exotel requires API_KEY : API_TOKEN
        String auth = apiKey + ":" + token;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + encodedAuth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formData.toString()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            System.out.println("✅ Exotel Call Initiated to: " + to);
            System.out.println("Response: " + response.body());
        } else {
            System.err.println("❌ Failed to initiate Exotel call. Status: " + response.statusCode());
            System.err.println("Response: " + response.body());
            throw new RuntimeException("Exotel API failed with status: " + response.statusCode());
        }
    }
}
