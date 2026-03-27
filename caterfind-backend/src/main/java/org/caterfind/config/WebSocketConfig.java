package org.caterfind.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration
 * Enables WebSocket support for real-time messaging
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    private final UserChannelInterceptor userChannelInterceptor;

    public WebSocketConfig(UserChannelInterceptor userChannelInterceptor) {
        this.userChannelInterceptor = userChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable simple broker for pub/sub messaging
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Register WebSocket endpoint
        String[] originPatterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        if (originPatterns.length == 0) {
            originPatterns = new String[] { "http://localhost:5173" };
        }
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(originPatterns)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(userChannelInterceptor);
    }
}
