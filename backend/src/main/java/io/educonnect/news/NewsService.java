package io.educonnect.news;

import io.educonnect.common.PageResponse;
import io.educonnect.common.exception.NotFoundException;
import io.educonnect.news.NewsDtos.NewsRequest;
import io.educonnect.news.NewsDtos.NewsResponse;
import io.educonnect.news.NewsDtos.NewsSummary;
import io.educonnect.security.AuthenticatedUser;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PageResponse<NewsSummary> listPublished(Pageable pageable) {
        return PageResponse.of(newsRepository.findAllByPublishedTrueOrderByPublishedAtDesc(pageable), NewsSummary::from);
    }

    @Transactional(readOnly = true)
    public NewsResponse getPublished(Long id) {
        return newsRepository.findByIdAndPublishedTrue(id)
                .map(NewsResponse::from)
                .orElseThrow(() -> NotFoundException.of("News article", id));
    }

    @Transactional(readOnly = true)
    public PageResponse<NewsSummary> listAll(Pageable pageable) {
        return PageResponse.of(newsRepository.findAllByOrderByCreatedAtDesc(pageable), NewsSummary::from);
    }

    @Transactional(readOnly = true)
    public NewsResponse get(Long id) {
        return NewsResponse.from(getById(id));
    }

    @Transactional
    public NewsResponse create(NewsRequest request, AuthenticatedUser author) {
        NewsArticle article = new NewsArticle();
        article.setAuthor(userRepository.getReferenceById(author.id()));
        apply(article, request);
        return NewsResponse.from(newsRepository.save(article));
    }

    @Transactional
    public NewsResponse update(Long id, NewsRequest request) {
        NewsArticle article = getById(id);
        apply(article, request);
        return NewsResponse.from(article);
    }

    @Transactional
    public void delete(Long id) {
        newsRepository.delete(getById(id));
    }

    private void apply(NewsArticle article, NewsRequest request) {
        article.setTitle(request.title().trim());
        article.setSummary(request.summary());
        article.setContent(request.content());
        if (request.published() && article.getPublishedAt() == null) {
            article.setPublishedAt(clock.instant());
        }
        article.setPublished(request.published());
    }

    private NewsArticle getById(Long id) {
        return newsRepository.findById(id).orElseThrow(() -> NotFoundException.of("News article", id));
    }
}
