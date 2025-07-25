package io.educonnect.course;

import io.educonnect.common.exception.BadRequestException;
import io.educonnect.common.exception.NotFoundException;
import io.educonnect.course.CourseDtos.ChapterAdminResponse;
import io.educonnect.course.CourseDtos.ChapterRequest;
import io.educonnect.course.CourseDtos.CourseAdminResponse;
import io.educonnect.course.CourseDtos.CourseOverview;
import io.educonnect.course.CourseDtos.CourseRequest;
import io.educonnect.course.CourseDtos.CourseSummary;
import io.educonnect.course.CourseDtos.ExerciseAdminResponse;
import io.educonnect.course.CourseDtos.ExerciseRequest;
import io.educonnect.security.AuthenticatedUser;
import io.educonnect.user.Role;
import io.educonnect.user.User;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Course catalog and content management. Administrators manage every course; teachers manage only
 * the courses assigned to them.
 */
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    // ---- Public catalog -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CourseSummary> listPublished() {
        return courseRepository.findAllByPublishedTrueOrderByPositionAscTitleAsc().stream()
                .map(CourseSummary::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseOverview getPublishedOverview(Long id) {
        Course course = courseRepository.findById(id)
                .filter(Course::isPublished)
                .orElseThrow(() -> NotFoundException.of("Course", id));
        return CourseOverview.from(course);
    }

    // ---- Courses --------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CourseAdminResponse> listManageable(AuthenticatedUser actor) {
        List<Course> courses = actor.role() == Role.ADMIN
                ? courseRepository.findAllByOrderByPositionAscTitleAsc()
                : courseRepository.findAllByTeacherIdOrderByPositionAscTitleAsc(actor.id());
        return courses.stream().map(CourseAdminResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CourseAdminResponse getManageable(Long id, AuthenticatedUser actor) {
        return CourseAdminResponse.from(requireManageableCourse(id, actor));
    }

    @Transactional
    public CourseAdminResponse create(CourseRequest request, AuthenticatedUser actor) {
        Course course = new Course();
        apply(course, request, actor);
        return CourseAdminResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseAdminResponse update(Long id, CourseRequest request, AuthenticatedUser actor) {
        Course course = requireManageableCourse(id, actor);
        apply(course, request, actor);
        return CourseAdminResponse.from(course);
    }

    @Transactional
    public void delete(Long id, AuthenticatedUser actor) {
        courseRepository.delete(requireManageableCourse(id, actor));
    }

    // ---- Chapters -------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ChapterAdminResponse> listChapters(Long courseId, AuthenticatedUser actor) {
        return requireManageableCourse(courseId, actor).getChapters().stream()
                .map(ChapterAdminResponse::from)
                .toList();
    }

    @Transactional
    public ChapterAdminResponse createChapter(Long courseId, ChapterRequest request, AuthenticatedUser actor) {
        Course course = requireManageableCourse(courseId, actor);
        Chapter chapter = new Chapter();
        chapter.setCourse(course);
        applyChapter(chapter, request);
        course.getChapters().add(chapter);
        return ChapterAdminResponse.from(chapterRepository.save(chapter));
    }

    @Transactional
    public ChapterAdminResponse updateChapter(Long chapterId, ChapterRequest request, AuthenticatedUser actor) {
        Chapter chapter = requireManageableChapter(chapterId, actor);
        applyChapter(chapter, request);
        return ChapterAdminResponse.from(chapter);
    }

    @Transactional
    public void deleteChapter(Long chapterId, AuthenticatedUser actor) {
        Chapter chapter = requireManageableChapter(chapterId, actor);
        chapter.getCourse().getChapters().remove(chapter);
    }

    // ---- Exercises ------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ExerciseAdminResponse> listExercises(Long chapterId, AuthenticatedUser actor) {
        return requireManageableChapter(chapterId, actor).getExercises().stream()
                .map(ExerciseAdminResponse::from)
                .toList();
    }

    @Transactional
    public ExerciseAdminResponse createExercise(Long chapterId, ExerciseRequest request, AuthenticatedUser actor) {
        Chapter chapter = requireManageableChapter(chapterId, actor);
        Exercise exercise = new Exercise();
        exercise.setChapter(chapter);
        applyExercise(exercise, request);
        chapter.getExercises().add(exercise);
        return ExerciseAdminResponse.from(exerciseRepository.save(exercise));
    }

    @Transactional
    public ExerciseAdminResponse updateExercise(Long exerciseId, ExerciseRequest request, AuthenticatedUser actor) {
        Exercise exercise = requireManageableExercise(exerciseId, actor);
        applyExercise(exercise, request);
        return ExerciseAdminResponse.from(exercise);
    }

    @Transactional
    public void deleteExercise(Long exerciseId, AuthenticatedUser actor) {
        Exercise exercise = requireManageableExercise(exerciseId, actor);
        exercise.getChapter().getExercises().remove(exercise);
    }

    // ---- Helpers --------------------------------------------------------------------------------

    private void apply(Course course, CourseRequest request, AuthenticatedUser actor) {
        course.setTitle(request.title().trim());
        course.setSummary(request.summary());
        course.setDescription(request.description());
        course.setCategory(request.category());
        course.setPublished(request.published());
        course.setPosition(request.position());
        course.setTeacher(resolveTeacher(request.teacherId(), actor));
    }

    /** Teachers always own the courses they edit; administrators may assign any teacher (or none). */
    private User resolveTeacher(Long teacherId, AuthenticatedUser actor) {
        if (actor.role() != Role.ADMIN) {
            return userRepository.getReferenceById(actor.id());
        }
        if (teacherId == null) {
            return null;
        }
        User teacher = userRepository.findById(teacherId).orElseThrow(() -> NotFoundException.of("User", teacherId));
        if (teacher.getRole() == Role.STUDENT) {
            throw new BadRequestException("A student cannot be assigned as course teacher");
        }
        return teacher;
    }

    private static void applyChapter(Chapter chapter, ChapterRequest request) {
        chapter.setTitle(request.title().trim());
        chapter.setContent(request.content());
        chapter.setPosition(request.position());
    }

    private static void applyExercise(Exercise exercise, ExerciseRequest request) {
        exercise.setQuestion(request.question().trim());
        exercise.setAnswer(request.answer().trim());
        exercise.setHint(request.hint());
        exercise.setPosition(request.position());
    }

    private Course requireManageableCourse(Long id, AuthenticatedUser actor) {
        Course course = courseRepository.findById(id).orElseThrow(() -> NotFoundException.of("Course", id));
        assertCanManage(course, actor);
        return course;
    }

    private Chapter requireManageableChapter(Long id, AuthenticatedUser actor) {
        Chapter chapter = chapterRepository.findById(id).orElseThrow(() -> NotFoundException.of("Chapter", id));
        assertCanManage(chapter.getCourse(), actor);
        return chapter;
    }

    private Exercise requireManageableExercise(Long id, AuthenticatedUser actor) {
        Exercise exercise = exerciseRepository.findById(id).orElseThrow(() -> NotFoundException.of("Exercise", id));
        assertCanManage(exercise.getChapter().getCourse(), actor);
        return exercise;
    }

    private static void assertCanManage(Course course, AuthenticatedUser actor) {
        if (actor.role() == Role.ADMIN) {
            return;
        }
        boolean ownsCourse = course.getTeacher() != null && course.getTeacher().getId().equals(actor.id());
        if (!ownsCourse) {
            throw new AccessDeniedException("Course " + course.getId() + " is not assigned to you");
        }
    }
}
