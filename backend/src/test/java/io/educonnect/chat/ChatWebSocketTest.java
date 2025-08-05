package io.educonnect.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ChatWebSocketTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(converter);
    }

    @Test
    void authenticatedUsersExchangeMessagesInRealTime() throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + login());

        StompSession session = stompClient
                .connectAsync(url(), new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {
                })
                .get(5, TimeUnit.SECONDS);

        CompletableFuture<JsonNode> received = new CompletableFuture<>();
        session.subscribe("/topic/rooms/general", new StompFrameHandler() {
            @Override
            @NonNull
            public Type getPayloadType(@NonNull StompHeaders headers) {
                return JsonNode.class;
            }

            @Override
            public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                received.complete((JsonNode) payload);
            }
        });
        // Give the broker a moment to register the subscription before publishing.
        Thread.sleep(200);
        session.send("/app/chat/general", Map.of("content", "Hello class!"));

        JsonNode message = received.get(5, TimeUnit.SECONDS);
        assertThat(message.get("content").asText()).isEqualTo("Hello class!");
        assertThat(message.get("senderName").asText()).isEqualTo("Adam Student");
        assertThat(message.get("senderRole").asText()).isEqualTo("STUDENT");
        session.disconnect();
    }

    @Test
    void connectionWithoutTokenIsRejected() {
        CompletableFuture<StompSession> future = stompClient.connectAsync(url(), new StompSessionHandlerAdapter() {
        });

        assertThatThrownBy(() -> future.get(5, TimeUnit.SECONDS)).isNotNull();
    }

    private String url() {
        return "ws://localhost:" + port + "/ws";
    }

    private String login() {
        JsonNode response = rest.postForObject("/api/v1/auth/login",
                Map.of("email", "student@educonnect.local", "password", "Student@12345"), JsonNode.class);
        return response.get("accessToken").asText();
    }
}
