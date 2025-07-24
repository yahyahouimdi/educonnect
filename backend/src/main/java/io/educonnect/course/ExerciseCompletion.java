package io.educonnect.course;

import io.educonnect.common.BaseEntity;
import io.educonnect.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Records that a student answered an exercise correctly. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "exercise_completions")
public class ExerciseCompletion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    public ExerciseCompletion(User user, Exercise exercise) {
        this.user = user;
        this.exercise = exercise;
    }
}
