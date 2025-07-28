package io.educonnect.course;

import io.educonnect.course.CourseDtos.AttemptRequest;
import io.educonnect.course.CourseDtos.AttemptResult;
import io.educonnect.course.CourseDtos.CourseProgress;
import io.educonnect.course.CourseDtos.LearningCourse;
import io.educonnect.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Learning")
@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @Operation(summary = "Progress of the current user on every published course")
    @GetMapping("/progress")
    public List<CourseProgress> progress(@AuthenticationPrincipal AuthenticatedUser user) {
        return learningService.getProgress(user);
    }

    @Operation(summary = "Full course content with the current user's completion state")
    @GetMapping("/courses/{courseId}")
    public LearningCourse course(@PathVariable Long courseId, @AuthenticationPrincipal AuthenticatedUser user) {
        return learningService.getCourse(courseId, user);
    }

    @Operation(summary = "Submit an answer to an exercise")
    @PostMapping("/exercises/{exerciseId}/attempts")
    public AttemptResult attempt(@PathVariable Long exerciseId,
                                 @Valid @RequestBody AttemptRequest request,
                                 @AuthenticationPrincipal AuthenticatedUser user) {
        return learningService.submitAnswer(exerciseId, request.answer(), user);
    }
}
