package io.educonnect.course;

import io.educonnect.common.exception.NotFoundException;
import io.educonnect.course.CourseDtos.AttemptResult;
import io.educonnect.course.CourseDtos.CourseProgress;
import io.educonnect.course.CourseDtos.LearningCourse;
import io.educonnect.course.CourseDtos.Progress;
import io.educonnect.course.ExerciseCompletionRepository.CourseCompletionCount;
import io.educonnect.security.AuthenticatedUser;
import io.educonnect.user.Role;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final CourseRepository courseRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseCompletionRepository completionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public LearningCourse getCourse(Long courseId, AuthenticatedUser learner) {
        Course course = requireVisibleCourse(courseId, learner);
        return LearningCourse.from(course, completionRepository.findCompletedExerciseIds(learner.id(), courseId));
    }

    @Transactional
    public AttemptResult submitAnswer(Long exerciseId, String answer, AuthenticatedUser learner) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> NotFoundException.of("Exercise", exerciseId));
        Course course = requireVisibleCourse(exercise.getChapter().getCourse().getId(), learner);

        boolean correct = AnswerMatcher.matches(exercise.getAnswer(), answer);
        if (correct && !completionRepository.existsByUserIdAndExerciseId(learner.id(), exerciseId)) {
            completionRepository.save(new ExerciseCompletion(userRepository.getReferenceById(learner.id()), exercise));
        }

        int completed = completionRepository.findCompletedExerciseIds(learner.id(), course.getId()).size();
        return new AttemptResult(exerciseId, correct, Progress.of(course.exerciseCount(), completed));
    }

    @Transactional(readOnly = true)
    public List<CourseProgress> getProgress(AuthenticatedUser learner) {
        Map<Long, Long> completedByCourse = completionRepository.countCompletedByCourse(learner.id()).stream()
                .collect(Collectors.toMap(CourseCompletionCount::getCourseId, CourseCompletionCount::getCompleted));

        return courseRepository.findAllByPublishedTrueOrderByPositionAscTitleAsc().stream()
                .map(course -> new CourseProgress(course.getId(), course.getTitle(), course.getCategory(),
                        Progress.of(course.exerciseCount(),
                                completedByCourse.getOrDefault(course.getId(), 0L).intValue())))
                .toList();
    }

    /** Students only see published courses; staff can preview drafts. */
    private Course requireVisibleCourse(Long courseId, AuthenticatedUser learner) {
        return courseRepository.findById(courseId)
                .filter(course -> course.isPublished() || learner.role() != Role.STUDENT)
                .orElseThrow(() -> NotFoundException.of("Course", courseId));
    }
}
