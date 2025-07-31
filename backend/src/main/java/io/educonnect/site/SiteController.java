package io.educonnect.site;

import io.educonnect.contact.ContactMessageRepository;
import io.educonnect.course.CourseRepository;
import io.educonnect.news.NewsRepository;
import io.educonnect.resource.LearningResourceRepository;
import io.educonnect.site.SiteDtos.DashboardStats;
import io.educonnect.site.SiteDtos.PublicStats;
import io.educonnect.site.SiteDtos.SiteResponse;
import io.educonnect.site.SiteDtos.SiteSettingsRequest;
import io.educonnect.user.Role;
import io.educonnect.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@Tag(name = "Site")
@RestController
@RequiredArgsConstructor
public class SiteController {

    private final SiteSettingsService siteSettingsService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LearningResourceRepository resourceRepository;
    private final NewsRepository newsRepository;
    private final ContactMessageRepository contactMessageRepository;

    // ---- Public ---------------------------------------------------------------------------------

    @Operation(summary = "Institution identity, branding and enabled features")
    @GetMapping("/api/v1/site")
    public SiteResponse get() {
        return siteSettingsService.get();
    }

    @GetMapping("/api/v1/site/logo")
    public ResponseEntity<Resource> logo() {
        Resource logo = siteSettingsService.loadLogo();
        MediaType type = MediaTypeFactory.getMediaType(logo).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(logo);
    }

    @Operation(summary = "Key figures displayed on the home page")
    @GetMapping("/api/v1/site/stats")
    public PublicStats stats() {
        return new PublicStats(userRepository.countByRole(Role.STUDENT), userRepository.countByRole(Role.TEACHER),
                courseRepository.countByPublishedTrue(), resourceRepository.count());
    }

    // ---- Administration -------------------------------------------------------------------------

    @PutMapping("/api/v1/admin/site")
    public SiteResponse update(@Valid @RequestBody SiteSettingsRequest request) {
        return siteSettingsService.update(request);
    }

    @PostMapping(value = "/api/v1/admin/site/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SiteResponse uploadLogo(@RequestPart("file") MultipartFile file) {
        return siteSettingsService.replaceLogo(file);
    }

    @DeleteMapping("/api/v1/admin/site/logo")
    public SiteResponse removeLogo() {
        return siteSettingsService.removeLogo();
    }

    @Operation(summary = "Counters for the administration dashboard")
    @GetMapping("/api/v1/admin/dashboard")
    public DashboardStats dashboard() {
        return new DashboardStats(userRepository.countByRole(Role.STUDENT), userRepository.countByRole(Role.TEACHER),
                userRepository.countByRole(Role.ADMIN), courseRepository.count(), courseRepository.countByPublishedTrue(),
                resourceRepository.count(), newsRepository.count(), contactMessageRepository.countByReadFalse());
    }
}
