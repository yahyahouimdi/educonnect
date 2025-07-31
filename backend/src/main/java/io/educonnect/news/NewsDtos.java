package io.educonnect.news;

import io.educonnect.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Optional;

public final class NewsDtos {

    private NewsDtos() {
    }

    public record NewsSummary(Long id, String title, String summary, boolean published, Instant publishedAt,
                              String authorName) {

        public static NewsSummary from(NewsArticle article) {
            return new NewsSummary(article.getId(), article.getTitle(), article.getSummary(), article.isPublished(),
                    article.getPublishedAt(), authorNameOf(article));
        }
    }

    public record NewsResponse(Long id, String title, String summary, String content, boolean published,
                               Instant publishedAt, String authorName, Instant updatedAt) {

        public static NewsResponse from(NewsArticle article) {
            return new NewsResponse(article.getId(), article.getTitle(), article.getSummary(), article.getContent(),
                    article.isPublished(), article.getPublishedAt(), authorNameOf(article), article.getUpdatedAt());
        }
    }

    public record NewsRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 500) String summary,
            @Size(max = 1_000_000) String content,
            boolean published) {
    }

    private static String authorNameOf(NewsArticle article) {
        return Optional.ofNullable(article.getAuthor()).map(User::getFullName).orElse(null);
    }
}
