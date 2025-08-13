import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { PublicApi } from '@core/api.service';
import { CourseSummary } from '@core/models';
import { PageBannerComponent } from '@shared/page-banner.component';
import { CourseCardComponent } from './course-card.component';

@Component({
  selector: 'app-programs',
  imports: [PageBannerComponent, CourseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-banner
      eyebrow="Programs"
      title="Our courses"
      subtitle="Browse the courses available on our digital campus. Sign in to follow them and track your progress."
    />

    <section class="section">
      <div class="container">
        @if (courses() === undefined) {
          <div class="loading"><span class="spinner"></span></div>
        } @else if (courses()!.length === 0) {
          <div class="empty">
            <i class="bi bi-journal-x"></i>
            <h3>No courses yet</h3>
            <p>New courses will be published here soon.</p>
          </div>
        } @else {
          @if (categories().length > 1) {
            <div class="row filters" role="group" aria-label="Filter by category">
              <button class="btn btn--sm" type="button" [class.btn--primary]="!category()" (click)="category.set(null)">
                All
              </button>
              @for (item of categories(); track item) {
                <button
                  class="btn btn--sm"
                  type="button"
                  [class.btn--primary]="category() === item"
                  (click)="category.set(item)"
                >
                  {{ item }}
                </button>
              }
            </div>
          }
          <div class="grid grid--3">
            @for (course of filtered(); track course.id) {
              <app-course-card [course]="course" />
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .filters {
      margin-bottom: 24px;
    }
  `,
})
export default class ProgramsComponent {
  protected readonly courses = toSignal(
    inject(PublicApi)
      .courses()
      .pipe(catchError(() => of([] as CourseSummary[]))),
  );
  protected readonly category = signal<string | null>(null);

  protected readonly categories = computed(() => [
    ...new Set((this.courses() ?? []).map((course) => course.category).filter((c): c is string => !!c)),
  ]);

  protected readonly filtered = computed(() => {
    const category = this.category();
    const courses = this.courses() ?? [];
    return category ? courses.filter((course) => course.category === category) : courses;
  });
}
