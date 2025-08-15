import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LearningApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { CourseProgress } from '@core/models';
import { SiteService } from '@core/site.service';

@Component({
  selector: 'app-learn-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Hello, {{ firstName() }} 👋</h1>
        <p>Pick up where you left off.</p>
      </div>
    </div>

    @if (courses(); as courses) {
      <div class="grid grid--4 summary">
        <div class="card">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-journal-bookmark"></i></span>
            <div>
              <div class="stat__value">{{ courses.length }}</div>
              <div class="stat__label">Available courses</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-hourglass-split"></i></span>
            <div>
              <div class="stat__value">{{ inProgress() }}</div>
              <div class="stat__label">In progress</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-trophy"></i></span>
            <div>
              <div class="stat__value">{{ completed() }}</div>
              <div class="stat__label">Completed</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-check2-circle"></i></span>
            <div>
              <div class="stat__value">{{ exercisesDone() }}</div>
              <div class="stat__label">Exercises solved</div>
            </div>
          </div>
        </div>
      </div>

      <h2 class="section-title">My courses</h2>
      @if (courses.length === 0) {
        <div class="card empty">
          <i class="bi bi-journal-x"></i>
          <h3>No courses available yet</h3>
          <p>Your teachers have not published any course yet. Check back soon!</p>
        </div>
      } @else {
        <div class="grid grid--3">
          @for (course of courses; track course.courseId) {
            <div class="card course">
              <div class="card__body stack">
                <div class="row row--between">
                  <span class="badge badge--brand">{{ course.category || 'Course' }}</span>
                  @if (course.progress.percent === 100) {
                    <span class="badge badge--success"><i class="bi bi-check2"></i> Completed</span>
                  }
                </div>
                <h3 class="mb-0">{{ course.title }}</h3>
                <div>
                  <div class="row row--between text-sm text-muted">
                    <span
                      >{{ course.progress.completedExercises }} / {{ course.progress.totalExercises }} exercises</span
                    >
                    <strong>{{ course.progress.percent }}%</strong>
                  </div>
                  <div class="progress mt-0">
                    <div class="progress__bar" [style.width.%]="course.progress.percent"></div>
                  </div>
                </div>
                <a [routerLink]="['/app/courses', course.courseId]" class="btn btn--soft">
                  {{ action(course) }} <i class="bi bi-arrow-right"></i>
                </a>
              </div>
            </div>
          }
        </div>
      }

      <div class="grid grid--3 shortcuts">
        <a routerLink="/app/resources" class="card card--hover">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-folder2-open"></i></span>
            <div>
              <strong>Resources</strong>
              <div class="stat__label">Course notes and documents</div>
            </div>
          </div>
        </a>
        <a routerLink="/app/chat" class="card card--hover">
          <div class="card__body stat">
            <span class="stat__icon"><i class="bi bi-chat-dots"></i></span>
            <div>
              <strong>Chat</strong>
              <div class="stat__label">Talk with classmates and teachers</div>
            </div>
          </div>
        </a>
        @if (site.info().features.assistant) {
          <a routerLink="/app/assistant" class="card card--hover">
            <div class="card__body stat">
              <span class="stat__icon"><i class="bi bi-stars"></i></span>
              <div>
                <strong>AI assistant</strong>
                <div class="stat__label">Get help understanding a topic</div>
              </div>
            </div>
          </a>
        }
      </div>
    } @else {
      <div class="loading"><span class="spinner"></span></div>
    }
  `,
  styles: `
    .summary {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 16px;
    }
    .course .progress {
      margin-top: 6px;
    }
    .shortcuts {
      margin-top: 32px;
    }
  `,
})
export default class LearnDashboardComponent {
  private readonly auth = inject(AuthService);
  protected readonly site = inject(SiteService);

  protected readonly courses = toSignal(
    inject(LearningApi)
      .progress()
      .pipe(catchError(() => of([] as CourseProgress[]))),
  );

  protected readonly firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  protected readonly inProgress = computed(
    () => (this.courses() ?? []).filter((c) => c.progress.percent > 0 && c.progress.percent < 100).length,
  );
  protected readonly completed = computed(
    () => (this.courses() ?? []).filter((c) => c.progress.totalExercises > 0 && c.progress.percent === 100).length,
  );
  protected readonly exercisesDone = computed(() =>
    (this.courses() ?? []).reduce((sum, c) => sum + c.progress.completedExercises, 0),
  );

  protected action(course: CourseProgress): string {
    if (course.progress.percent === 100) return 'Review';
    return course.progress.completedExercises > 0 ? 'Continue' : 'Start';
  }
}
