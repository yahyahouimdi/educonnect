import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApi } from '@core/api.service';
import { ChapterAdmin, CourseAdmin, CourseRequest, ExerciseAdmin } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';
import { ModalComponent } from '@shared/modal.component';
import { CourseFormComponent } from './course-form.component';

@Component({
  selector: 'app-course-editor',
  imports: [RouterLink, ReactiveFormsModule, MarkdownPipe, ModalComponent, CourseFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-editor.component.html',
  styleUrl: './course-editor.component.scss',
})
export default class CourseEditorComponent {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly site = inject(SiteService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = input.required<string>();
  private readonly courseId = computed(() => Number(this.id()));

  protected readonly tab = signal<'content' | 'details'>('content');
  protected readonly course = signal<CourseAdmin | null>(null);
  protected readonly chapters = signal<ChapterAdmin[]>([]);
  protected readonly selectedChapterId = signal<number | null>(null);
  protected readonly exercises = signal<ExerciseAdmin[]>([]);
  protected readonly preview = signal(false);
  protected readonly savingCourse = signal(false);
  protected readonly savingChapter = signal(false);
  protected readonly savingExercise = signal(false);
  /** `null` = closed, `'new'` = creating, otherwise the exercise being edited. */
  protected readonly exerciseDialog = signal<ExerciseAdmin | 'new' | null>(null);

  protected readonly selectedChapter = computed(
    () => this.chapters().find((chapter) => chapter.id === this.selectedChapterId()) ?? null,
  );

  protected readonly chapterForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    position: [1, [Validators.min(0)]],
    content: [''],
  });

  protected readonly exerciseForm = this.fb.group({
    question: ['', [Validators.required, Validators.maxLength(5000)]],
    answer: ['', [Validators.required, Validators.maxLength(500)]],
    hint: [''],
    position: [1, [Validators.min(0)]],
  });

  constructor() {
    effect(() => this.load(this.courseId()));

    // Load the selected chapter into the editor form and fetch its exercises. Only a change of
    // selection should do this: list updates (e.g. exercise counts) must not discard unsaved edits.
    effect(() => {
      this.selectedChapterId();
      const chapter = untracked(() => this.selectedChapter());
      this.preview.set(false);
      if (!chapter) {
        this.exercises.set([]);
        return;
      }
      this.chapterForm.reset({ title: chapter.title, position: chapter.position, content: chapter.content ?? '' });
      this.api.exercises(chapter.id).subscribe((exercises) => this.exercises.set(exercises));
    });
  }

  // ---- Course ---------------------------------------------------------------------------------

  protected saveCourse(request: CourseRequest): void {
    this.savingCourse.set(true);
    this.api.updateCourse(this.courseId(), request).subscribe({
      next: (course) => {
        this.savingCourse.set(false);
        this.course.set(course);
        this.notifications.success('Course details saved.');
      },
      error: (error) => {
        this.savingCourse.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected async deleteCourse(): Promise<void> {
    const course = this.course();
    if (!course) return;
    const confirmed = await this.notifications.confirm({
      title: 'Delete course?',
      message: `"${course.title}" and all its content and student progress will be permanently deleted.`,
      confirmLabel: 'Delete course',
    });
    if (!confirmed) return;
    this.api.deleteCourse(course.id).subscribe({
      next: () => {
        this.notifications.success('Course deleted.');
        void this.router.navigate(['/admin/courses']);
      },
      error: (error) => this.notifications.error(error),
    });
  }

  // ---- Chapters -------------------------------------------------------------------------------

  protected addChapter(): void {
    const position = this.chapters().length + 1;
    this.api.createChapter(this.courseId(), { title: `Chapter ${position}`, content: '', position }).subscribe({
      next: (chapter) => {
        this.chapters.update((chapters) => [...chapters, chapter]);
        this.selectedChapterId.set(chapter.id);
      },
      error: (error) => this.notifications.error(error),
    });
  }

  protected saveChapter(): void {
    const chapter = this.selectedChapter();
    if (!chapter || this.chapterForm.invalid) return;
    this.savingChapter.set(true);
    this.api.updateChapter(chapter.id, this.chapterForm.getRawValue()).subscribe({
      next: (saved) => {
        this.savingChapter.set(false);
        this.chapters.update((chapters) =>
          chapters.map((c) => (c.id === saved.id ? saved : c)).sort((a, b) => a.position - b.position || a.id - b.id),
        );
        this.chapterForm.markAsPristine();
        this.notifications.success('Chapter saved.');
      },
      error: (error) => {
        this.savingChapter.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected async deleteChapter(): Promise<void> {
    const chapter = this.selectedChapter();
    if (!chapter) return;
    const confirmed = await this.notifications.confirm({
      title: 'Delete chapter?',
      message: `"${chapter.title}" and its exercises will be permanently deleted.`,
      confirmLabel: 'Delete chapter',
    });
    if (!confirmed) return;
    this.api.deleteChapter(chapter.id).subscribe({
      next: () => {
        const remaining = this.chapters().filter((c) => c.id !== chapter.id);
        this.chapters.set(remaining);
        this.selectedChapterId.set(remaining[0]?.id ?? null);
        this.notifications.success('Chapter deleted.');
      },
      error: (error) => this.notifications.error(error),
    });
  }

  // ---- Exercises ------------------------------------------------------------------------------

  protected openExercise(exercise: ExerciseAdmin | 'new'): void {
    if (exercise === 'new') {
      this.exerciseForm.reset({ question: '', answer: '', hint: '', position: this.exercises().length + 1 });
    } else {
      this.exerciseForm.reset({
        question: exercise.question,
        answer: exercise.answer,
        hint: exercise.hint ?? '',
        position: exercise.position,
      });
    }
    this.exerciseDialog.set(exercise);
  }

  protected saveExercise(): void {
    const chapter = this.selectedChapter();
    const target = this.exerciseDialog();
    if (!chapter || !target || this.exerciseForm.invalid) return;

    const value = this.exerciseForm.getRawValue();
    const request = { ...value, hint: value.hint.trim() || null };
    const call =
      target === 'new' ? this.api.createExercise(chapter.id, request) : this.api.updateExercise(target.id, request);

    this.savingExercise.set(true);
    call.subscribe({
      next: () => {
        this.savingExercise.set(false);
        this.exerciseDialog.set(null);
        this.refreshExercises(chapter.id);
        this.notifications.success(target === 'new' ? 'Exercise added.' : 'Exercise updated.');
      },
      error: (error) => {
        this.savingExercise.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected async deleteExercise(exercise: ExerciseAdmin): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete exercise?',
      message: 'This exercise and the related student progress will be deleted.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.api.deleteExercise(exercise.id).subscribe({
      next: () => this.refreshExercises(exercise.chapterId),
      error: (error) => this.notifications.error(error),
    });
  }

  private refreshExercises(chapterId: number): void {
    this.api.exercises(chapterId).subscribe((exercises) => {
      this.exercises.set(exercises);
      this.chapters.update((chapters) =>
        chapters.map((c) => (c.id === chapterId ? { ...c, exerciseCount: exercises.length } : c)),
      );
    });
  }

  private load(courseId: number): void {
    this.api.course(courseId).subscribe({
      next: (course) => {
        this.course.set(course);
        this.site.setPageTitle(`Edit · ${course.title}`);
      },
      error: (error) => {
        this.notifications.error(error, 'This course could not be loaded.');
        void this.router.navigate(['/admin/courses']);
      },
    });
    this.api.chapters(courseId).subscribe((chapters) => {
      this.chapters.set(chapters);
      this.selectedChapterId.set(chapters[0]?.id ?? null);
    });
  }
}
