package io.educonnect.resource;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningResourceRepository extends JpaRepository<LearningResource, Long> {

    @EntityGraph(attributePaths = {"course", "uploadedBy"})
    List<LearningResource> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"course", "uploadedBy"})
    List<LearningResource> findAllByCourseIdOrderByCreatedAtDesc(Long courseId);
}
