package io.educonnect.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findAllByOrderByPositionAscTitleAsc();

    List<Course> findAllByPublishedTrueOrderByPositionAscTitleAsc();

    List<Course> findAllByTeacherIdOrderByPositionAscTitleAsc(Long teacherId);

    long countByPublishedTrue();
}
