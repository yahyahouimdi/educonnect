package io.educonnect.site;

import io.educonnect.common.exception.NotFoundException;
import io.educonnect.config.AppProperties;
import io.educonnect.site.SiteDtos.Features;
import io.educonnect.site.SiteDtos.SiteResponse;
import io.educonnect.site.SiteDtos.SiteSettingsRequest;
import io.educonnect.site.SiteDtos.SocialLinks;
import io.educonnect.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class SiteSettingsService {

    private final SiteSettingsRepository repository;
    private final StorageService storageService;
    private final AppProperties properties;

    /** Creates the settings row from environment defaults if it does not exist yet. */
    @Transactional
    public SiteSettings ensureInitialized() {
        return repository.findFirstByOrderByIdAsc().orElseGet(() -> {
            AppProperties.Institution defaults = properties.institution();
            SiteSettings settings = new SiteSettings();
            settings.setName(defaults.name());
            settings.setShortName(defaults.shortName());
            settings.setTagline(defaults.tagline());
            settings.setEmail(defaults.email());
            settings.setPhone(defaults.phone());
            settings.setAddress(defaults.address());
            settings.setPrimaryColor(defaults.primaryColor());
            settings.setAbout("""
                    %s is committed to delivering high-quality education and preparing students for \
                    successful careers. Our teachers combine academic excellence with hands-on practice, \
                    and our digital learning platform lets every student learn at their own pace.""".formatted(defaults.name()));
            return repository.save(settings);
        });
    }

    @Transactional
    public SiteResponse get() {
        return toResponse(ensureInitialized());
    }

    @Transactional
    public SiteResponse update(SiteSettingsRequest request) {
        SiteSettings settings = ensureInitialized();
        settings.setName(request.name().trim());
        settings.setShortName(request.shortName().trim());
        settings.setTagline(request.tagline());
        settings.setAbout(request.about());
        settings.setEmail(request.email());
        settings.setPhone(request.phone());
        settings.setAddress(request.address());
        settings.setWebsite(blankToNull(request.website()));
        settings.setPrimaryColor(request.primaryColor().toLowerCase());
        settings.setFacebookUrl(blankToNull(request.facebookUrl()));
        settings.setLinkedinUrl(blankToNull(request.linkedinUrl()));
        settings.setXUrl(blankToNull(request.xUrl()));
        settings.setYoutubeUrl(blankToNull(request.youtubeUrl()));
        return toResponse(settings);
    }

    @Transactional
    public SiteResponse replaceLogo(MultipartFile file) {
        SiteSettings settings = ensureInitialized();
        String previous = settings.getLogoFilename();
        settings.setLogoFilename(storageService.storeImage(file));
        storageService.delete(previous);
        return toResponse(repository.saveAndFlush(settings));
    }

    @Transactional
    public SiteResponse removeLogo() {
        SiteSettings settings = ensureInitialized();
        storageService.delete(settings.getLogoFilename());
        settings.setLogoFilename(null);
        return toResponse(settings);
    }

    @Transactional(readOnly = true)
    public Resource loadLogo() {
        return repository.findFirstByOrderByIdAsc()
                .map(SiteSettings::getLogoFilename)
                .filter(StringUtils::hasText)
                .map(storageService::load)
                .orElseThrow(() -> new NotFoundException("No logo has been uploaded"));
    }

    private SiteResponse toResponse(SiteSettings settings) {
        String logoUrl = settings.getLogoFilename() == null ? null
                // The stored name changes with every upload, so it doubles as a cache buster.
                : "/api/v1/site/logo?v=" + settings.getLogoFilename().substring(0, 8);
        return new SiteResponse(settings.getName(), settings.getShortName(), settings.getTagline(), settings.getAbout(),
                settings.getEmail(), settings.getPhone(), settings.getAddress(), settings.getWebsite(),
                settings.getPrimaryColor(), logoUrl,
                new SocialLinks(settings.getFacebookUrl(), settings.getLinkedinUrl(), settings.getXUrl(),
                        settings.getYoutubeUrl()),
                new Features(properties.assistant().enabled()));
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
