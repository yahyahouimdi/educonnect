import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSummary } from '@core/models';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card card--hover course-card" [routerLink]="['/programs', course().id]">
      <div class="course-card__cover">
        <i class="bi bi-journal-bookmark-fill"></i>
        @if (course().category) {
          <span class="badge">{{ course().category }}</span>
        }
      </div>
      <div class="card__body">
        <h3>{{ course().title }}</h3>
        <p class="text-muted text-sm">{{ course().summary }}</p>
        <div class="row text-sm text-muted">
          <span><i class="bi bi-collection"></i> {{ course().chapterCount }} chapters</span>
          <span><i class="bi bi-patch-question"></i> {{ course().exerciseCount }} exercises</span>
        </div>
        @if (course().teacherName) {
          <div class="course-card__teacher text-sm"><i class="bi bi-person-badge"></i> {{ course().teacherName }}</div>
        }
      </div>
    </a>
  `,
  styles: `
    .course-card {
      height: 100%;
      overflow: hidden;
    }
    .course-card__cover {
      position: relative;
      height: 120px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--brand-100), var(--brand-50));
      color: var(--brand);
      font-size: 2.4rem;
      .badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: var(--surface);
      }
    }
    h3 {
      margin-bottom: 6px;
    }
    .course-card__teacher {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      color: var(--ink-2);
    }
  `,
})
export class CourseCardComponent {
  readonly course = input.required<CourseSummary>();
}
