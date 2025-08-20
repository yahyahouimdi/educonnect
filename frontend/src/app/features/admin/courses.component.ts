import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminApi } from '@core/api.service';
import { CourseAdmin, CourseRequest } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { CourseFormComponent } from './course-form.component';
import { ModalComponent } from '@shared/modal.component';

@Component({
  selector: 'app-admin-courses',
  imports: [RouterLink, DatePipe, ModalComponent, CourseFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Courses</h1>
        <p>Create courses, organise chapters and write exercises.</p>
      </div>
      <button class="btn btn--primary" type="button" (click)="creating.set(true)">
        <i class="bi bi-plus-lg"></i> New course
      </button>
    </div>

    <div class="card">
      @if (courses() === null) {
        <div class="loading"><span class="spinner"></span></div>
      } @else if (courses()!.length === 0) {
        <div class="empty">
          <i class="bi bi-journal-plus"></i>
          <h3>No courses yet</h3>
          <p>Create your first course to get started.</p>
          <button class="btn btn--primary" type="button" (click)="creating.set(true)">New course</button>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher</th>
                <th>Content</th>
                <th>Status</th>
                <th>Updated</th>
                <th class="actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (course of courses(); track course.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/admin/courses', course.id]"
                      ><strong>{{ course.title }}</strong></a
                    >
                    @if (course.category) {
                      <div class="text-muted text-sm">{{ course.category }}</div>
                    }
                  </td>
                  <td>{{ course.teacherName ?? '—' }}</td>
                  <td class="text-muted">{{ course.chapterCount }} chapters · {{ course.exerciseCount }} exercises</td>
                  <td>
                    <span class="badge" [class.badge--success]="course.published">{{
                      course.published ? 'Published' : 'Draft'
                    }}</span>
                  </td>
                  <td class="text-muted">{{ course.updatedAt | date: 'mediumDate' }}</td>
                  <td class="actions">
                    <a class="icon-btn" [routerLink]="['/admin/courses', course.id]" title="Edit" aria-label="Edit">
                      <i class="bi bi-pencil"></i>
                    </a>
                    <a class="icon-btn" [routerLink]="['/app/courses', course.id]" title="Preview" aria-label="Preview">
                      <i class="bi bi-eye"></i>
                    </a>
                    <button
                      class="icon-btn icon-btn--danger"
                      type="button"
                      title="Delete"
                      aria-label="Delete"
                      (click)="remove(course)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (creating()) {
      <app-modal title="New course" (closed)="creating.set(false)">
        <app-course-form
          submitLabel="Create course"
          [saving]="saving()"
          (save)="create($event)"
          (cancel)="creating.set(false)"
        />
      </app-modal>
    }
  `,
})
export default class CoursesComponent {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly courses = signal<CourseAdmin[] | null>(null);
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);

  constructor() {
    this.load();
  }

  protected create(request: CourseRequest): void {
    this.saving.set(true);
    this.api.createCourse(request).subscribe({
      next: (course) => {
        this.saving.set(false);
        this.notifications.success('Course created. Now add some chapters.');
        void this.router.navigate(['/admin/courses', course.id]);
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected async remove(course: CourseAdmin): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete course?',
      message: `"${course.title}" and all its chapters, exercises and student progress will be permanently deleted.`,
      confirmLabel: 'Delete course',
    });
    if (!confirmed) return;
    this.api.deleteCourse(course.id).subscribe({
      next: () => {
        this.notifications.success('Course deleted.');
        this.load();
      },
      error: (error) => this.notifications.error(error),
    });
  }

  private load(): void {
    this.api.courses().subscribe({
      next: (courses) => this.courses.set(courses),
      error: (error) => {
        this.courses.set([]);
        this.notifications.error(error);
      },
    });
  }
}
