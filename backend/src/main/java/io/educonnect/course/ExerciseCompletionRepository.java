package io.educonnect.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface ExerciseCompletionRepository extends JpaRepository<ExerciseCompletion, Long> {

    boolean existsByUserIdAndExerciseId(Long userId, Long exerciseId);

    @Query("""
            select c.exercise.id from ExerciseCompletion c
            where c.user.id = :userId and c.exercise.chapter.course.id = :courseId
            """)
    Set<Long> findCompletedExerciseIds(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("""
            select c.exercise.chapter.course.id as courseId, count(c) as completed
            from ExerciseCompletion c
            where c.user.id = :userId
            group by c.exercise.chapter.course.id
            """)
    List<CourseCompletionCount> countCompletedByCourse(@Param("userId") Long userId);

    interface CourseCompletionCount {
        Long getCourseId();

        long getCompleted();
    }
}
