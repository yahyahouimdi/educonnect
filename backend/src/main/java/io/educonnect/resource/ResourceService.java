package io.educonnect.resource;

import io.educonnect.common.exception.NotFoundException;
import io.educonnect.course.CourseRepository;
import io.educonnect.security.AuthenticatedUser;
import io.educonnect.storage.StorageService;
import io.educonnect.user.Role;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final LearningResourceRepository resourceRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<ResourceResponse> list(Long courseId) {
        List<LearningResource> resources = courseId == null
                ? resourceRepository.findAllByOrderByCreatedAtDesc()
                : resourceRepository.findAllByCourseIdOrderByCreatedAtDesc(courseId);
        return resources.stream().map(ResourceResponse::from).toList();
    }

    @Transactional
    public ResourceResponse upload(MultipartFile file, String title, String description, Long courseId,
                                   AuthenticatedUser uploader) {
        LearningResource resource = new LearningResource();
        resource.setTitle(StringUtils.hasText(title) ? title.trim() : file.getOriginalFilename());
        resource.setDescription(description);
        resource.setOriginalFilename(StringUtils.cleanPath(String.valueOf(file.getOriginalFilename())));
        resource.setContentType(file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE);
        resource.setSizeBytes(file.getSize());
        resource.setUploadedBy(userRepository.getReferenceById(uploader.id()));
        if (courseId != null) {
            resource.setCourse(courseRepository.findById(courseId).orElseThrow(() -> NotFoundException.of("Course", courseId)));
        }
        resource.setStoredFilename(storageService.store(file));
        return ResourceResponse.from(resourceRepository.save(resource));
    }

    @Transactional(readOnly = true)
    public Download download(Long id) {
        LearningResource resource = getById(id);
        Resource body = storageService.load(resource.getStoredFilename());
        return new Download(body, resource.getOriginalFilename(), resource.getContentType(), resource.getSizeBytes());
    }

    @Transactional
    public void delete(Long id, AuthenticatedUser actor) {
        LearningResource resource = getById(id);
        boolean isUploader = resource.getUploadedBy() != null && resource.getUploadedBy().getId().equals(actor.id());
        if (actor.role() != Role.ADMIN && !isUploader) {
            throw new AccessDeniedException("Only the uploader or an administrator can delete this resource");
        }
        resourceRepository.delete(resource);
        // Only remove the file once the row is really gone, so a rollback never leaves a dangling record.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                storageService.delete(resource.getStoredFilename());
            }
        });
    }

    private LearningResource getById(Long id) {
        return resourceRepository.findById(id).orElseThrow(() -> NotFoundException.of("Resource", id));
    }

    public record Download(Resource body, String filename, String contentType, long size) {
    }
}
