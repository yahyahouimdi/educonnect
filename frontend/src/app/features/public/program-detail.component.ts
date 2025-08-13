import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { PublicApi } from '@core/api.service';
import { CourseOverview } from '@core/models';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';
import { PageBannerComponent } from '@shared/page-banner.component';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; course: CourseOverview };

@Component({
  selector: 'app-program-detail',
  imports: [RouterLink, MarkdownPipe, PageBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state().status) {
      @case ('loading') {
        <div class="loading"><span class="spinner"></span></div>
      }
      @case ('error') {
        <section class="section">
          <div class="container empty">
            <i class="bi bi-journal-x"></i>
            <h3>Course not found</h3>
            <p>This course does not exist or is no longer available.</p>
            <a routerLink="/programs" class="btn btn--primary">Back to programs</a>
          </div>
        </section>
      }
      @case ('ready') {
        @if (course(); as course) {
          <app-page-banner [eyebrow]="course.category ?? 'Course'" [title]="course.title" [subtitle]="course.summary" />
          <section class="section">
            <div class="container detail">
              <div>
                <h2>About this course</h2>
                <div class="prose" [innerHTML]="course.description | markdown"></div>

                <h2 class="mt-3">Course outline</h2>
                <ol class="outline">
                  @for (title of course.chapterTitles; track $index) {
                    <li>
                      <span class="outline__index">{{ $index + 1 }}</span>
                      <span>{{ title }}</span>
                    </li>
                  }
                </ol>
              </div>
              <aside class="card">
                <div class="card__body stack">
                  @if (course.teacherName) {
                    <div class="row"><i class="bi bi-person-badge"></i> Taught by {{ course.teacherName }}</div>
                  }
                  <div class="row"><i class="bi bi-collection"></i> {{ course.chapterTitles.length }} chapters</div>
                  <div class="row"><i class="bi bi-patch-question"></i> {{ course.exerciseCount }} exercises</div>
                  <a [routerLink]="['/app/courses', course.id]" class="btn btn--primary btn--block btn--lg">
                    Start learning <i class="bi bi-arrow-right"></i>
                  </a>
                  <p class="text-muted text-sm mb-0">Sign in with your institution account to access the course.</p>
                </div>
              </aside>
            </div>
          </section>
        }
      }
    }
  `,
  styles: `
    .detail {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 48px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: calc(var(--header-h) + 20px);
    }
    .outline {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      li {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        font-weight: 500;
      }
    }
    .outline__index {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--brand-50);
      color: var(--brand);
      font-weight: 700;
      font-size: 0.85rem;
    }
    @media (max-width: 860px) {
      .detail {
        grid-template-columns: 1fr;
      }
      aside {
        position: static;
      }
    }
  `,
})
export default class ProgramDetailComponent {
  private readonly api = inject(PublicApi);
  private readonly site = inject(SiteService);

  readonly id = input.required<string>();

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.api.course(Number(id)).pipe(
          map((course): State => ({ status: 'ready', course })),
          catchError(() => of<State>({ status: 'error' })),
          startWith<State>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as State },
  );

  protected readonly course = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.course : null;
  });

  constructor() {
    effect(() => {
      const course = this.course();
      if (course) this.site.setPageTitle(course.title);
    });
  }
}
