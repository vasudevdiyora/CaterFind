package org.caterfind.config;

import java.security.Principal;

import org.caterfind.service.JwtService;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Interceptor to extract userId from STOMP CONNECT headers and set as Principal
 */
@Component
public class UserChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public UserChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String resolvedUserId = null;

            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    Long userIdFromToken = jwtService.extractUserId(token);
                    if (userIdFromToken != null) {
                        resolvedUserId = userIdFromToken.toString();
                    }
                } catch (Exception ignored) {
                    // Keep fallback behavior when token is not present/valid.
                }
            }

            if (resolvedUserId == null) {
                String userIdHeader = accessor.getFirstNativeHeader("userId");
                if (userIdHeader != null && !userIdHeader.isBlank()) {
                    resolvedUserId = userIdHeader;
                }
            }

            if (resolvedUserId != null) {
                Principal principal = new SimplePrincipal(resolvedUserId);
                accessor.setUser(principal);
            }
        }
        
        return message;
    }

    /**
     * Simple Principal implementation
     */
    private static class SimplePrincipal implements Principal {
        private final String name;

        public SimplePrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}