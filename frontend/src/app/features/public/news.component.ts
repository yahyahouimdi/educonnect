import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PublicApi } from '@core/api.service';
import { NewsSummary, Page } from '@core/models';
import { PageBannerComponent } from '@shared/page-banner.component';
import { PagerComponent } from '@shared/pager.component';

const EMPTY_PAGE: Page<NewsSummary> = { content: [], page: 0, size: 9, totalElements: 0, totalPages: 0 };

@Component({
  selector: 'app-news',
  imports: [RouterLink, DatePipe, PageBannerComponent, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-banner
      eyebrow="News"
      title="News & announcements"
      subtitle="Official news, events and announcements from the institution."
    />

    <section class="section">
      <div class="container">
        @if (news(); as news) {
          @if (news.content.length === 0) {
            <div class="empty">
              <i class="bi bi-megaphone"></i>
              <h3>No news yet</h3>
              <p>Announcements will appear here.</p>
            </div>
          } @else {
            <div class="grid grid--3">
              @for (article of news.content; track article.id) {
                <a class="card card--hover" [routerLink]="['/news', article.id]">
                  <div class="card__body">
                    <span class="badge badge--brand"
                      ><i class="bi bi-calendar3"></i> {{ article.publishedAt | date: 'mediumDate' }}</span
                    >
                    <h3 class="mt-2">{{ article.title }}</h3>
                    <p class="text-muted">{{ article.summary }}</p>
                    <span class="text-sm">Read more <i class="bi bi-arrow-right"></i></span>
                  </div>
                </a>
              }
            </div>
            <app-pager [page]="news.page" [totalPages]="news.totalPages" (pageChange)="page.set($event)" />
          }
        } @else {
          <div class="loading"><span class="spinner"></span></div>
        }
      </div>
    </section>
  `,
})
export default class NewsComponent {
  private readonly api = inject(PublicApi);
  protected readonly page = signal(0);

  protected readonly news = toSignal(
    toObservable(this.page).pipe(switchMap((page) => this.api.news(page).pipe(catchError(() => of(EMPTY_PAGE))))),
  );
}
