package io.educonnect.course;

import io.educonnect.course.CourseDtos.ChapterAdminResponse;
import io.educonnect.course.CourseDtos.ChapterRequest;
import io.educonnect.course.CourseDtos.CourseAdminResponse;
import io.educonnect.course.CourseDtos.CourseRequest;
import io.educonnect.course.CourseDtos.ExerciseAdminResponse;
import io.educonnect.course.CourseDtos.ExerciseRequest;
import io.educonnect.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Admin · Courses")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;

    // ---- Courses --------------------------------------------------------------------------------

    @GetMapping("/courses")
    public List<CourseAdminResponse> listCourses(@AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.listManageable(actor);
    }

    @GetMapping("/courses/{id}")
    public CourseAdminResponse getCourse(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.getManageable(id, actor);
    }

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseAdminResponse createCourse(@Valid @RequestBody CourseRequest request,
                                            @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.create(request, actor);
    }

    @PutMapping("/courses/{id}")
    public CourseAdminResponse updateCourse(@PathVariable Long id, @Valid @RequestBody CourseRequest request,
                                            @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.update(id, request, actor);
    }

    @DeleteMapping("/courses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCourse(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        courseService.delete(id, actor);
    }

    // ---- Chapters -------------------------------------------------------------------------------

    @GetMapping("/courses/{courseId}/chapters")
    public List<ChapterAdminResponse> listChapters(@PathVariable Long courseId,
                                                   @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.listChapters(courseId, actor);
    }

    @PostMapping("/courses/{courseId}/chapters")
    @ResponseStatus(HttpStatus.CREATED)
    public ChapterAdminResponse createChapter(@PathVariable Long courseId, @Valid @RequestBody ChapterRequest request,
                                              @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.createChapter(courseId, request, actor);
    }

    @PutMapping("/chapters/{id}")
    public ChapterAdminResponse updateChapter(@PathVariable Long id, @Valid @RequestBody ChapterRequest request,
                                              @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.updateChapter(id, request, actor);
    }

    @DeleteMapping("/chapters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChapter(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        courseService.deleteChapter(id, actor);
    }

    // ---- Exercises ------------------------------------------------------------------------------

    @GetMapping("/chapters/{chapterId}/exercises")
    public List<ExerciseAdminResponse> listExercises(@PathVariable Long chapterId,
                                                     @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.listExercises(chapterId, actor);
    }

    @PostMapping("/chapters/{chapterId}/exercises")
    @ResponseStatus(HttpStatus.CREATED)
    public ExerciseAdminResponse createExercise(@PathVariable Long chapterId, @Valid @RequestBody ExerciseRequest request,
                                                @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.createExercise(chapterId, request, actor);
    }

    @PutMapping("/exercises/{id}")
    public ExerciseAdminResponse updateExercise(@PathVariable Long id, @Valid @RequestBody ExerciseRequest request,
                                                @AuthenticationPrincipal AuthenticatedUser actor) {
        return courseService.updateExercise(id, request, actor);
    }

    @DeleteMapping("/exercises/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExercise(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        courseService.deleteExercise(id, actor);
    }
}
