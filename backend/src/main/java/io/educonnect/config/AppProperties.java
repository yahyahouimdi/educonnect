package io.educonnect.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

/**
 * Strongly typed view of the {@code app.*} configuration tree.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @Valid @NotNull Security security,
        @Valid @NotNull Bootstrap bootstrap,
        @Valid @NotNull Institution institution,
        @Valid @NotNull Storage storage,
        @Valid @NotNull Assistant assistant) {

    public record Security(
            @NotBlank @Size(min = 64, message = "JWT_SECRET must be at least 64 characters") String jwtSecret,
            @NotNull Duration jwtExpiration,
            List<String> corsAllowedOrigins) {
    }

    public record Bootstrap(
            @NotBlank String adminEmail,
            @NotBlank @Size(min = 8) String adminPassword,
            @NotBlank String adminName,
            boolean demoData) {
    }

    public record Institution(
            @NotBlank String name,
            @NotBlank String shortName,
            String tagline,
            String email,
            String phone,
            String address,
            @NotBlank String primaryColor) {
    }

    public record Storage(@NotBlank String location) {
    }

    public record Assistant(String apiKey, @NotBlank String model, @NotBlank String baseUrl, String systemPrompt) {

        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
