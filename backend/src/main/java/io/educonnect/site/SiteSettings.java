package io.educonnect.site;

import io.educonnect.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Institution identity shown across the public website. A single row exists; it is created from
 * environment defaults on first start and then edited from the admin console.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "site_settings")
public class SiteSettings extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "short_name", nullable = false, length = 50)
    private String shortName;

    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String about;

    @Column(length = 190)
    private String email;

    @Column(length = 50)
    private String phone;

    private String address;

    private String website;

    @Column(name = "primary_color", nullable = false, length = 7)
    private String primaryColor;

    @Column(name = "logo_filename", length = 100)
    private String logoFilename;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "x_url")
    private String xUrl;

    @Column(name = "youtube_url")
    private String youtubeUrl;
}
