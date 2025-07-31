package io.educonnect.site;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class SiteDtos {

    private static final String URL_PATTERN = "^$|^https?://.+";

    private SiteDtos() {
    }

    public record SiteResponse(String name, String shortName, String tagline, String about, String email, String phone,
                               String address, String website, String primaryColor, String logoUrl,
                               SocialLinks social, Features features) {
    }

    public record SocialLinks(String facebook, String linkedin, String x, String youtube) {
    }

    /** Optional capabilities the frontend should show or hide. */
    public record Features(boolean assistant) {
    }

    public record SiteSettingsRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 50) String shortName,
            @Size(max = 255) String tagline,
            @Size(max = 20000) String about,
            @Email @Size(max = 190) String email,
            @Size(max = 50) String phone,
            @Size(max = 255) String address,
            @Pattern(regexp = URL_PATTERN, message = "must be an http(s) URL") @Size(max = 255) String website,
            @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "must be a hex color such as #1d4ed8") String primaryColor,
            @Pattern(regexp = URL_PATTERN, message = "must be an http(s) URL") @Size(max = 255) String facebookUrl,
            @Pattern(regexp = URL_PATTERN, message = "must be an http(s) URL") @Size(max = 255) String linkedinUrl,
            @Pattern(regexp = URL_PATTERN, message = "must be an http(s) URL") @Size(max = 255) String xUrl,
            @Pattern(regexp = URL_PATTERN, message = "must be an http(s) URL") @Size(max = 255) String youtubeUrl) {
    }

    public record PublicStats(long students, long teachers, long courses, long resources) {
    }

    public record DashboardStats(long students, long teachers, long admins, long courses, long publishedCourses,
                                 long resources, long news, long unreadMessages) {
    }
}
