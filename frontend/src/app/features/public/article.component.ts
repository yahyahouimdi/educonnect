import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PublicApi } from '@core/api.service';
import { NewsArticle } from '@core/models';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';

@Component({
  selector: 'app-article',
  imports: [RouterLink, DatePipe, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container article">
        <a routerLink="/news" class="btn btn--ghost btn--sm back"><i class="bi bi-arrow-left"></i> All news</a>
        @if (article(); as article) {
          @if (article === 'missing') {
            <div class="empty">
              <i class="bi bi-file-earmark-x"></i>
              <h3>Article not found</h3>
              <p>This article does not exist or has been removed.</p>
            </div>
          } @else {
            <article>
              <header>
                <span class="badge badge--brand"
                  ><i class="bi bi-calendar3"></i> {{ article.publishedAt | date: 'longDate' }}</span
                >
                <h1 class="mt-2">{{ article.title }}</h1>
                @if (article.summary) {
                  <p class="lead">{{ article.summary }}</p>
                }
                @if (article.authorName) {
                  <p class="text-muted text-sm">By {{ article.authorName }}</p>
                }
              </header>
              <div class="prose" [innerHTML]="article.content | markdown"></div>
            </article>
          }
        } @else {
          <div class="loading"><span class="spinner"></span></div>
        }
      </div>
    </section>
  `,
  styles: `
    .article {
      max-width: 780px;
    }
    .back {
      margin-bottom: 24px;
      margin-left: -12px;
    }
    header {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }
    .lead {
      font-size: 1.15rem;
      color: var(--ink-2);
    }
    .prose {
      font-size: 1.05rem;
    }
  `,
})
export default class ArticleComponent {
  private readonly api = inject(PublicApi);
  private readonly site = inject(SiteService);

  readonly id = input.required<string>();

  protected readonly article = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => this.api.article(Number(id)).pipe(catchError(() => of('missing' as const)))),
    ),
  );

  constructor() {
    effect(() => {
      const article = this.article();
      if (article && article !== 'missing') this.site.setPageTitle((article as NewsArticle).title);
    });
  }
}
