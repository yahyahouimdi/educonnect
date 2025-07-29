package io.educonnect.resource;

import io.educonnect.course.Course;
import io.educonnect.user.User;

import java.time.Instant;
import java.util.Optional;

public record ResourceResponse(Long id, String title, String description, String filename, String contentType,
                               long sizeBytes, Long courseId, String courseTitle, Long uploadedById,
                               String uploadedByName, Instant createdAt) {

    public static ResourceResponse from(LearningResource resource) {
        Optional<Course> course = Optional.ofNullable(resource.getCourse());
        Optional<User> uploader = Optional.ofNullable(resource.getUploadedBy());
        return new ResourceResponse(resource.getId(), resource.getTitle(), resource.getDescription(),
                resource.getOriginalFilename(), resource.getContentType(), resource.getSizeBytes(),
                course.map(Course::getId).orElse(null), course.map(Course::getTitle).orElse(null),
                uploader.map(User::getId).orElse(null), uploader.map(User::getFullName).orElse(null),
                resource.getCreatedAt());
    }
}
