package io.educonnect.course;

import io.educonnect.course.CourseDtos.CourseOverview;
import io.educonnect.course.CourseDtos.CourseSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Public · Courses")
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    @GetMapping
    public List<CourseSummary> list() {
        return courseService.listPublished();
    }

    @GetMapping("/{id}")
    public CourseOverview get(@PathVariable Long id) {
        return courseService.getPublishedOverview(id);
    }
}
