package io.educonnect.config;

import io.educonnect.security.TokenAuthenticator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Set<StompCommand> REQUIRES_USER = Set.of(StompCommand.SEND, StompCommand.SUBSCRIBE);

    private final TokenAuthenticator tokenAuthenticator;
    private final AppProperties properties;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = properties.security().corsAllowedOrigins();
        // Same-origin handshakes (the normal case behind the bundled reverse proxy) are always accepted.
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins == null ? new String[0] : origins.toArray(String[]::new));
    }

    /** Authenticates the STOMP CONNECT frame with the same bearer token used by the REST API. */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String header = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
                    accessor.setUser(tokenAuthenticator.authenticate(header)
                            .orElseThrow(() -> new MessageDeliveryException("Invalid or missing access token"))
                            .toAuthentication());
                } else if (REQUIRES_USER.contains(accessor.getCommand()) && accessor.getUser() == null) {
                    throw new MessageDeliveryException("Not authenticated");
                }
                return message;
            }
        });
    }
}
