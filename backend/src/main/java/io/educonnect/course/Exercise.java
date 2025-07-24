package io.educonnect.course;

import io.educonnect.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "exercises")
public class Exercise extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    /** Expected answer. Several accepted answers can be separated with {@code |}. */
    @Column(nullable = false, length = 500)
    private String answer;

    @Column(length = 500)
    private String hint;

    @Column(nullable = false)
    private int position;
}
