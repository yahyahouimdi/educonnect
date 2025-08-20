import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '@core/api.service';
import { NewsSummary, Page } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { PagerComponent } from '@shared/pager.component';

@Component({
  selector: 'app-news-admin',
  imports: [RouterLink, DatePipe, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>News</h1>
        <p>Publish announcements and events on the public website.</p>
      </div>
      <a routerLink="/admin/news/new" class="btn btn--primary"><i class="bi bi-plus-lg"></i> New article</a>
    </div>

    <div class="card">
      @if (news(); as news) {
        @if (news.content.length === 0) {
          <div class="empty">
            <i class="bi bi-megaphone"></i>
            <h3>No articles yet</h3>
            <p>Share your first announcement with visitors and students.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Author</th>
                  <th class="actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (article of news.content; track article.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/admin/news', article.id]"
                        ><strong>{{ article.title }}</strong></a
                      >
                      @if (article.summary) {
                        <div class="text-muted text-sm truncate summary">{{ article.summary }}</div>
                      }
                    </td>
                    <td>
                      <span class="badge" [class.badge--success]="article.published">{{
                        article.published ? 'Published' : 'Draft'
                      }}</span>
                    </td>
                    <td class="text-muted">{{ (article.publishedAt | date: 'mediumDate') ?? '—' }}</td>
                    <td class="text-muted">{{ article.authorName ?? '—' }}</td>
                    <td class="actions">
                      @if (article.published) {
                        <a
                          class="icon-btn"
                          [routerLink]="['/news', article.id]"
                          aria-label="View on website"
                          title="View on website"
                        >
                          <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                      }
                      <a class="icon-btn" [routerLink]="['/admin/news', article.id]" aria-label="Edit"
                        ><i class="bi bi-pencil"></i
                      ></a>
                      <button
                        class="icon-btn icon-btn--danger"
                        type="button"
                        aria-label="Delete"
                        (click)="remove(article)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [page]="news.page" [totalPages]="news.totalPages" (pageChange)="load($event)" />
        }
      } @else {
        <div class="loading"><span class="spinner"></span></div>
      }
    </div>
  `,
  styles: `
    .summary {
      max-width: 460px;
    }
  `,
})
export default class NewsAdminComponent {
  private readonly api = inject(AdminApi);
  private readonly notifications = inject(NotificationService);
  protected readonly news = signal<Page<NewsSummary> | null>(null);

  constructor() {
    this.load(0);
  }

  protected load(page: number): void {
    this.api.news(page).subscribe({
      next: (news) => this.news.set(news),
      error: (error) => this.notifications.error(error),
    });
  }

  protected async remove(article: NewsSummary): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete article?',
      message: `"${article.title}" will be permanently deleted.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.api.deleteArticle(article.id).subscribe({
      next: () => {
        this.notifications.success('Article deleted.');
        this.load(this.news()?.page ?? 0);
      },
      error: (error) => this.notifications.error(error),
    });
  }
}
