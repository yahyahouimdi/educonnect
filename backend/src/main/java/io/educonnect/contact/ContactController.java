package io.educonnect.contact;

import io.educonnect.common.PageResponse;
import io.educonnect.common.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@Slf4j
@Tag(name = "Contact")
@RestController
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageRepository repository;

    @Operation(summary = "Send a message to the institution (public contact form)")
    @PostMapping("/api/v1/contact")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Transactional
    public void submit(@Valid @RequestBody ContactRequest request) {
        // Honeypot: real visitors never see the "website" field, bots tend to fill it in.
        if (StringUtils.hasText(request.website())) {
            log.info("Discarded contact message flagged as spam");
            return;
        }
        ContactMessage message = new ContactMessage();
        message.setName(request.name().trim());
        message.setEmail(request.email().trim());
        message.setSubject(request.subject().trim());
        message.setMessage(request.message().trim());
        repository.save(message);
    }

    @GetMapping("/api/v1/admin/contact-messages")
    @Transactional(readOnly = true)
    public PageResponse<ContactMessageResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(repository.findAllByOrderByCreatedAtDesc(pageable), ContactMessageResponse::from);
    }

    @PatchMapping("/api/v1/admin/contact-messages/{id}")
    @Transactional
    public ContactMessageResponse markRead(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean read) {
        ContactMessage message = repository.findById(id).orElseThrow(() -> NotFoundException.of("Message", id));
        message.setRead(read);
        return ContactMessageResponse.from(message);
    }

    @DeleteMapping("/api/v1/admin/contact-messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Message", id)));
    }

    public record ContactRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Size(max = 5000) String message,
            String website) {
    }

    public record ContactMessageResponse(Long id, String name, String email, String subject, String message,
                                         boolean read, Instant createdAt) {

        static ContactMessageResponse from(ContactMessage message) {
            return new ContactMessageResponse(message.getId(), message.getName(), message.getEmail(),
                    message.getSubject(), message.getMessage(), message.isRead(), message.getCreatedAt());
        }
    }
}
