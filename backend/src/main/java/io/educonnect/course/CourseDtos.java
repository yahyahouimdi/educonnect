package io.educonnect.course;

import io.educonnect.user.User;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public final class CourseDtos {

    private CourseDtos() {
    }

    // ---- Public catalog -------------------------------------------------------------------------

    public record CourseSummary(Long id, String title, String summary, String category, String teacherName,
                                int chapterCount, int exerciseCount) {

        public static CourseSummary from(Course course) {
            return new CourseSummary(course.getId(), course.getTitle(), course.getSummary(), course.getCategory(),
                    teacherNameOf(course), course.getChapters().size(), course.exerciseCount());
        }
    }

    public record CourseOverview(Long id, String title, String summary, String description, String category,
                                 String teacherName, List<String> chapterTitles, int exerciseCount) {

        public static CourseOverview from(Course course) {
            return new CourseOverview(course.getId(), course.getTitle(), course.getSummary(), course.getDescription(),
                    course.getCategory(), teacherNameOf(course),
                    course.getChapters().stream().map(Chapter::getTitle).toList(), course.exerciseCount());
        }
    }

    // ---- Learning space (authenticated) ---------------------------------------------------------

    public record LearningCourse(Long id, String title, String summary, String description, String category,
                                 String teacherName, List<LearningChapter> chapters, Progress progress) {

        public static LearningCourse from(Course course, Set<Long> completedIds) {
            List<LearningChapter> chapters = course.getChapters().stream()
                    .map(chapter -> LearningChapter.from(chapter, completedIds))
                    .toList();
            return new LearningCourse(course.getId(), course.getTitle(), course.getSummary(), course.getDescription(),
                    course.getCategory(), teacherNameOf(course), chapters,
                    Progress.of(course.exerciseCount(), completedIds.size()));
        }
    }

    public record LearningChapter(Long id, String title, String content, int position, List<LearningExercise> exercises) {

        static LearningChapter from(Chapter chapter, Set<Long> completedIds) {
            return new LearningChapter(chapter.getId(), chapter.getTitle(), chapter.getContent(), chapter.getPosition(),
                    chapter.getExercises().stream()
                            .map(exercise -> LearningExercise.from(exercise, completedIds.contains(exercise.getId())))
                            .toList());
        }
    }

    /** Exercise as seen by a learner: the expected answer is never exposed. */
    public record LearningExercise(Long id, String question, String hint, int position, boolean completed) {

        static LearningExercise from(Exercise exercise, boolean completed) {
            return new LearningExercise(exercise.getId(), exercise.getQuestion(), exercise.getHint(),
                    exercise.getPosition(), completed);
        }
    }

    public record Progress(int totalExercises, int completedExercises, int percent) {

        public static Progress of(int total, int completed) {
            int percent = total == 0 ? 0 : Math.round(completed * 100f / total);
            return new Progress(total, completed, percent);
        }
    }

    public record CourseProgress(Long courseId, String title, String category, Progress progress) {
    }

    public record AttemptRequest(@NotBlank @Size(max = 2000) String answer) {
    }

    public record AttemptResult(Long exerciseId, boolean correct, Progress courseProgress) {
    }

    // ---- Administration -------------------------------------------------------------------------

    public record CourseRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 500) String summary,
            @Size(max = 20000) String description,
            @Size(max = 100) String category,
            boolean published,
            @Min(0) int position,
            Long teacherId) {
    }

    public record CourseAdminResponse(Long id, String title, String summary, String description, String category,
                                      boolean published, int position, Long teacherId, String teacherName,
                                      int chapterCount, int exerciseCount, Instant updatedAt) {

        public static CourseAdminResponse from(Course course) {
            return new CourseAdminResponse(course.getId(), course.getTitle(), course.getSummary(),
                    course.getDescription(), course.getCategory(), course.isPublished(), course.getPosition(),
                    Optional.ofNullable(course.getTeacher()).map(User::getId).orElse(null), teacherNameOf(course),
                    course.getChapters().size(), course.exerciseCount(), course.getUpdatedAt());
        }
    }

    public record ChapterRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 1_000_000) String content,
            @Min(0) int position) {
    }

    public record ChapterAdminResponse(Long id, Long courseId, String title, String content, int position,
                                       int exerciseCount) {

        public static ChapterAdminResponse from(Chapter chapter) {
            return new ChapterAdminResponse(chapter.getId(), chapter.getCourse().getId(), chapter.getTitle(),
                    chapter.getContent(), chapter.getPosition(), chapter.getExercises().size());
        }
    }

    public record ExerciseRequest(
            @NotBlank @Size(max = 5000) String question,
            @NotBlank @Size(max = 500) String answer,
            @Size(max = 500) String hint,
            @Min(0) int position) {
    }

    public record ExerciseAdminResponse(Long id, Long chapterId, String question, String answer, String hint,
                                        int position) {

        public static ExerciseAdminResponse from(Exercise exercise) {
            return new ExerciseAdminResponse(exercise.getId(), exercise.getChapter().getId(), exercise.getQuestion(),
                    exercise.getAnswer(), exercise.getHint(), exercise.getPosition());
        }
    }

    private static String teacherNameOf(Course course) {
        return Optional.ofNullable(course.getTeacher()).map(User::getFullName).orElse(null);
    }
}
