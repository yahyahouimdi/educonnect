import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApi } from '@core/api.service';
import { NewsRequest } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { MarkdownPipe } from '@shared/markdown.pipe';

@Component({
  selector: 'app-news-editor',
  imports: [RouterLink, ReactiveFormsModule, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb">
      <a routerLink="/admin/news">News</a> <i class="bi bi-chevron-right"></i> {{ isNew() ? 'New article' : 'Edit' }}
    </nav>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="page-header">
        <div>
          <h1>{{ isNew() ? 'New article' : 'Edit article' }}</h1>
          <p>Articles are written in Markdown.</p>
        </div>
        <div class="row">
          <label class="check"><input type="checkbox" formControlName="published" /> Published</label>
          <button class="btn btn--primary" type="submit" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <span class="spinner spinner--sm"></span>
            }
            {{ isNew() ? 'Create article' : 'Save changes' }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><span class="spinner"></span></div>
      } @else {
        <div class="card">
          <div class="card__body">
            <div class="field">
              <label for="news-title">Title</label>
              <input id="news-title" class="input" formControlName="title" />
            </div>
            <div class="field">
              <label for="news-summary">Summary</label>
              <input id="news-summary" class="input" formControlName="summary" maxlength="500" />
              <span class="hint">One or two sentences shown in news listings.</span>
            </div>
            <div class="editor-grid">
              <div class="field mb-0">
                <label for="news-content">Content</label>
                <textarea id="news-content" class="textarea textarea--code" formControlName="content"></textarea>
              </div>
              <div class="field mb-0">
                <label>Preview</label>
                <div class="prose preview" [innerHTML]="form.controls.content.value | markdown"></div>
              </div>
            </div>
          </div>
        </div>
      }
    </form>
  `,
  styles: `
    .editor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .textarea--code,
    .preview {
      min-height: 420px;
    }
    .preview {
      padding: 14px 16px;
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-sm);
      overflow: auto;
    }
    @media (max-width: 960px) {
      .editor-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class NewsEditorComponent {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly id = input.required<string>();
  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    summary: [''],
    content: [''],
    published: [true],
  });

  constructor() {
    effect(() => {
      if (this.isNew()) return;
      this.loading.set(true);
      this.api.article(Number(this.id())).subscribe({
        next: (article) => {
          this.form.reset({
            title: article.title,
            summary: article.summary ?? '',
            content: article.content ?? '',
            published: article.published,
          });
          this.loading.set(false);
        },
        error: (error) => {
          this.notifications.error(error, 'This article could not be loaded.');
          void this.router.navigate(['/admin/news']);
        },
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const request: NewsRequest = { ...value, summary: value.summary || null, content: value.content || null };
    const call = this.isNew() ? this.api.createArticle(request) : this.api.updateArticle(Number(this.id()), request);

    this.saving.set(true);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(request.published ? 'Article published.' : 'Draft saved.');
        void this.router.navigate(['/admin/news']);
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(error);
      },
    });
  }
}
