import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LearningApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { LearningChapter, LearningCourse, LearningExercise } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';

type Feedback = 'correct' | 'wrong';

@Component({
  selector: 'app-course-player',
  imports: [RouterLink, FormsModule, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-player.component.html',
  styleUrl: './course-player.component.scss',
})
export default class CoursePlayerComponent {
  private readonly api = inject(LearningApi);
  private readonly auth = inject(AuthService);
  private readonly site = inject(SiteService);
  private readonly notifications = inject(NotificationService);

  readonly id = input.required<string>();

  protected readonly course = signal<LearningCourse | null>(null);
  protected readonly notFound = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly answers = signal<Partial<Record<number, string>>>({});
  protected readonly feedback = signal<Partial<Record<number, Feedback>>>({});
  protected readonly revealedHints = signal<Set<number>>(new Set());
  protected readonly submitting = signal<number | null>(null);

  protected readonly chapters = computed(() => this.course()?.chapters ?? []);
  protected readonly activeChapter = computed<LearningChapter | null>(
    () => this.chapters()[this.activeIndex()] ?? null,
  );

  /** Students unlock a chapter by solving every exercise of the previous ones; staff can browse freely. */
  protected readonly unlockedUpTo = computed(() => {
    if (this.auth.isStaff()) return this.chapters().length - 1;
    const chapters = this.chapters();
    for (let i = 0; i < chapters.length; i++) {
      if (!this.isChapterComplete(chapters[i])) return i;
    }
    return chapters.length - 1;
  });

  constructor() {
    effect(() => this.load(Number(this.id())));
  }

  protected isChapterComplete(chapter: LearningChapter): boolean {
    return chapter.exercises.every((exercise) => exercise.completed);
  }

  protected select(index: number): void {
    if (index <= this.unlockedUpTo()) {
      this.activeIndex.set(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected setAnswer(exerciseId: number, value: string): void {
    this.answers.update((answers) => ({ ...answers, [exerciseId]: value }));
    this.feedback.update(({ [exerciseId]: _, ...rest }) => rest);
  }

  protected toggleHint(exerciseId: number): void {
    this.revealedHints.update((hints) => {
      const next = new Set(hints);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }

  protected submit(exercise: LearningExercise): void {
    const answer = (this.answers()[exercise.id] ?? '').trim();
    if (!answer) return;
    this.submitting.set(exercise.id);
    this.api.attempt(exercise.id, answer).subscribe({
      next: (result) => {
        this.submitting.set(null);
        this.feedback.update((feedback) => ({ ...feedback, [exercise.id]: result.correct ? 'correct' : 'wrong' }));
        if (result.correct) {
          this.markCompleted(exercise.id, result.courseProgress);
        }
      },
      error: (error) => {
        this.submitting.set(null);
        this.notifications.error(error);
      },
    });
  }

  private markCompleted(exerciseId: number, progress: LearningCourse['progress']): void {
    const wasComplete = this.activeChapter() ? this.isChapterComplete(this.activeChapter()!) : false;
    this.course.update((course) =>
      course
        ? {
            ...course,
            progress,
            chapters: course.chapters.map((chapter) => ({
              ...chapter,
              exercises: chapter.exercises.map((exercise) =>
                exercise.id === exerciseId ? { ...exercise, completed: true } : exercise,
              ),
            })),
          }
        : course,
    );
    const chapter = this.activeChapter();
    if (chapter && !wasComplete && this.isChapterComplete(chapter)) {
      const isLast = this.activeIndex() === this.chapters().length - 1;
      this.notifications.success(
        isLast ? 'Congratulations, you completed the course! 🎉' : 'Chapter completed! The next chapter is unlocked.',
      );
    }
  }

  private load(courseId: number): void {
    this.course.set(null);
    this.notFound.set(false);
    this.answers.set({});
    this.feedback.set({});
    this.api.course(courseId).subscribe({
      next: (course) => {
        this.course.set(course);
        this.site.setPageTitle(course.title);
        // Open the first chapter that still has work to do.
        const firstIncomplete = course.chapters.findIndex((chapter) => !this.isChapterComplete(chapter));
        this.activeIndex.set(firstIncomplete === -1 ? 0 : firstIncomplete);
      },
      error: () => this.notFound.set(true),
    });
  }
}
