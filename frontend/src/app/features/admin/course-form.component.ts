import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { CourseAdmin, CourseRequest, User } from '@core/models';

/** Course metadata form, used both in the creation dialog and the course editor. */
@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="course-title">Title</label>
        <input id="course-title" class="input" formControlName="title" placeholder="e.g. Introduction to Java" />
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="course-category">Category</label>
          <input id="course-category" class="input" formControlName="category" placeholder="e.g. Programming" />
        </div>
        <div class="field">
          <label for="course-position">Display order</label>
          <input id="course-position" class="input" type="number" min="0" formControlName="position" />
        </div>
      </div>
      <div class="field">
        <label for="course-summary">Short summary</label>
        <input id="course-summary" class="input" formControlName="summary" maxlength="500" />
        <span class="hint">Shown on course cards in the public catalog.</span>
      </div>
      <div class="field">
        <label for="course-description">Description</label>
        <textarea id="course-description" class="textarea" rows="4" formControlName="description"></textarea>
        <span class="hint">Markdown is supported.</span>
      </div>
      @if (auth.isAdmin()) {
        <div class="field">
          <label for="course-teacher">Teacher</label>
          <select id="course-teacher" class="select" formControlName="teacherId">
            <option [ngValue]="null">— Not assigned —</option>
            @for (teacher of teachers(); track teacher.id) {
              <option [ngValue]="teacher.id">{{ teacher.fullName }}</option>
            }
          </select>
          <span class="hint">Teachers can only edit the courses assigned to them.</span>
        </div>
      }
      <label class="check">
        <input type="checkbox" formControlName="published" />
        Published (visible to students and on the public website)
      </label>

      <div class="row row--end mt-3">
        @if (showCancel()) {
          <button class="btn btn--ghost" type="button" (click)="cancel.emit()">Cancel</button>
        }
        <button class="btn btn--primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <span class="spinner spinner--sm"></span>
          }
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
})
export class CourseFormComponent {
  private readonly api = inject(AdminApi);
  protected readonly auth = inject(AuthService);

  readonly course = input<CourseAdmin | null>(null);
  readonly submitLabel = input('Save');
  readonly saving = input(false);
  readonly showCancel = input(true);
  readonly save = output<CourseRequest>();
  readonly cancel = output<void>();

  protected readonly teachers = signal<User[]>([]);

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    category: [''],
    position: [0, [Validators.min(0)]],
    summary: [''],
    description: [''],
    teacherId: this.fb.control<number | null>(null),
    published: [false],
  });

  constructor() {
    if (this.auth.isAdmin()) {
      // Administrators may also teach, so they are valid assignees too.
      forkJoin([this.api.users({ role: 'TEACHER', size: 200 }), this.api.users({ role: 'ADMIN', size: 50 })]).subscribe(
        ([teachers, admins]) => this.teachers.set([...teachers.content, ...admins.content]),
      );
    }

    effect(() => {
      const course = this.course();
      if (course) {
        this.form.reset({
          title: course.title,
          category: course.category ?? '',
          position: course.position,
          summary: course.summary ?? '',
          description: course.description ?? '',
          teacherId: course.teacherId ?? null,
          published: course.published,
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.save.emit({
      ...value,
      title: value.title.trim(),
      category: value.category.trim() || null,
      summary: value.summary.trim() || null,
      description: value.description || null,
    });
  }
}
