package io.educonnect.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import io.educonnect.common.exception.ServiceUnavailableException;
import io.educonnect.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;

/**
 * Thin client for the Google Gemini {@code generateContent} API. The API key stays on the server;
 * browsers only ever talk to this backend.
 */
@Slf4j
@Service
public class AssistantService {

    private final AppProperties.Assistant config;
    private final RestClient restClient;

    public AssistantService(AppProperties properties, RestClient.Builder builder) {
        this.config = properties.assistant();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(60));
        this.restClient = builder.baseUrl(config.baseUrl()).requestFactory(requestFactory).build();
    }

    public boolean isEnabled() {
        return config.enabled();
    }

    public String reply(List<AssistantMessage> conversation) {
        if (!isEnabled()) {
            throw new ServiceUnavailableException("The assistant is not configured. Set AI_API_KEY to enable it.");
        }

        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", config.systemPrompt()))),
                "contents", conversation.stream()
                        .map(message -> Map.of(
                                "role", message.role() == AssistantMessage.Role.ASSISTANT ? "model" : "user",
                                "parts", List.of(Map.of("text", message.content()))))
                        .toList());

        try {
            JsonNode response = restClient.post()
                    .uri("/models/{model}:generateContent", config.model())
                    .header("x-goog-api-key", config.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            return extractText(response);
        } catch (RestClientException ex) {
            log.warn("Assistant request failed: {}", ex.getMessage());
            throw new ServiceUnavailableException("The assistant is temporarily unavailable. Please try again later.");
        }
    }

    private static String extractText(JsonNode response) {
        JsonNode parts = response == null ? null : response.path("candidates").path(0).path("content").path("parts");
        if (parts == null || !parts.isArray() || parts.isEmpty()) {
            throw new ServiceUnavailableException("The assistant returned an empty answer. Please rephrase your question.");
        }
        return StreamSupport.stream(parts.spliterator(), false)
                .map(part -> part.path("text").asText(""))
                .reduce("", String::concat)
                .trim();
    }
}
