package io.educonnect.news;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NewsRepository extends JpaRepository<NewsArticle, Long> {

    @EntityGraph(attributePaths = "author")
    Page<NewsArticle> findAllByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<NewsArticle> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Optional<NewsArticle> findByIdAndPublishedTrue(Long id);
}
