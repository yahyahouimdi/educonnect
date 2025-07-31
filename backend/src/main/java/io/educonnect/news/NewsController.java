package io.educonnect.news;

import io.educonnect.common.PageResponse;
import io.educonnect.news.NewsDtos.NewsRequest;
import io.educonnect.news.NewsDtos.NewsResponse;
import io.educonnect.news.NewsDtos.NewsSummary;
import io.educonnect.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "News")
@RestController
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    // ---- Public ---------------------------------------------------------------------------------

    @GetMapping("/api/v1/news")
    public PageResponse<NewsSummary> listPublished(@PageableDefault(size = 9) Pageable pageable) {
        return newsService.listPublished(pageable);
    }

    @GetMapping("/api/v1/news/{id}")
    public NewsResponse getPublished(@PathVariable Long id) {
        return newsService.getPublished(id);
    }

    // ---- Administration -------------------------------------------------------------------------

    @GetMapping("/api/v1/admin/news")
    public PageResponse<NewsSummary> listAll(@PageableDefault(size = 20) Pageable pageable) {
        return newsService.listAll(pageable);
    }

    @GetMapping("/api/v1/admin/news/{id}")
    public NewsResponse get(@PathVariable Long id) {
        return newsService.get(id);
    }

    @PostMapping("/api/v1/admin/news")
    @ResponseStatus(HttpStatus.CREATED)
    public NewsResponse create(@Valid @RequestBody NewsRequest request,
                               @AuthenticationPrincipal AuthenticatedUser author) {
        return newsService.create(request, author);
    }

    @PutMapping("/api/v1/admin/news/{id}")
    public NewsResponse update(@PathVariable Long id, @Valid @RequestBody NewsRequest request) {
        return newsService.update(id, request);
    }

    @DeleteMapping("/api/v1/admin/news/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        newsService.delete(id);
    }
}
