package org.caterfind.config;

import java.security.Principal;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Interceptor to extract userId from STOMP CONNECT headers and set as Principal
 */
public class UserChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String userId = accessor.getFirstNativeHeader("userId");
            
            // System.out.println("WebSocket CONNECT: userId=" + userId);
            
            if (userId != null) {
                // Create a simple principal with the userId
                Principal principal = new SimplePrincipal(userId);
                accessor.setUser(principal);
                // System.out.println("Set user principal: " + userId);
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