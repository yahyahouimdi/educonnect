import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { LearningApi } from '@core/api.service';
import { LearningResource } from '@core/models';
import { fileIcon, FileSizePipe } from '@shared/format';

@Component({
  selector: 'app-resources',
  imports: [DatePipe, FormsModule, FileSizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Resources</h1>
        <p>Course notes, exercise sheets and documents shared by your teachers.</p>
      </div>
    </div>

    @if (resources(); as resources) {
      <div class="card">
        <div class="card__header">
          <div class="input-icon search">
            <i class="bi bi-search"></i>
            <input
              class="input"
              type="search"
              placeholder="Search resources…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              aria-label="Search resources"
            />
          </div>
          @if (courses().length) {
            <select
              class="select course-filter"
              [ngModel]="course()"
              (ngModelChange)="course.set($event)"
              aria-label="Filter by course"
            >
              <option value="">All courses</option>
              @for (title of courses(); track title) {
                <option [value]="title">{{ title }}</option>
              }
            </select>
          }
        </div>

        @if (filtered().length === 0) {
          <div class="empty">
            <i class="bi bi-folder-x"></i>
            <h3>No resources found</h3>
            <p>{{ resources.length ? 'Try another search.' : 'Nothing has been shared yet.' }}</p>
          </div>
        } @else {
          <ul class="files">
            @for (resource of filtered(); track resource.id) {
              <li class="file">
                <span class="file__icon"><i [class]="'bi ' + icon(resource)"></i></span>
                <div class="file__info">
                  <strong class="truncate">{{ resource.title }}</strong>
                  <span class="text-muted text-sm">
                    {{ resource.filename }} · {{ resource.sizeBytes | fileSize }} ·
                    {{ resource.createdAt | date: 'mediumDate' }}
                    @if (resource.courseTitle) {
                      · <span class="badge badge--brand">{{ resource.courseTitle }}</span>
                    }
                  </span>
                  @if (resource.description) {
                    <span class="text-sm">{{ resource.description }}</span>
                  }
                </div>
                <button class="btn btn--soft btn--sm" type="button" (click)="api.download(resource)">
                  <i class="bi bi-download"></i> Download
                </button>
              </li>
            }
          </ul>
        }
      </div>
    } @else {
      <div class="loading"><span class="spinner"></span></div>
    }
  `,
  styles: `
    .search {
      flex: 1;
      max-width: 420px;
    }
    .course-filter {
      width: auto;
      min-width: 200px;
    }
    .files {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .file {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 22px;
      border-bottom: 1px solid var(--line);
      &:last-child {
        border-bottom: 0;
      }
    }
    .file__icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--brand-50);
      color: var(--brand);
      font-size: 1.3rem;
      flex-shrink: 0;
    }
    .file__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    @media (max-width: 640px) {
      .card__header {
        flex-direction: column;
        align-items: stretch;
      }
      .search {
        max-width: none;
      }
      .file {
        flex-wrap: wrap;
      }
    }
  `,
})
export default class ResourcesComponent {
  protected readonly api = inject(LearningApi);

  protected readonly resources = toSignal(this.api.resources().pipe(catchError(() => of([] as LearningResource[]))));
  protected readonly query = signal('');
  protected readonly course = signal('');

  protected readonly courses = computed(() => [
    ...new Set((this.resources() ?? []).map((r) => r.courseTitle).filter((t): t is string => !!t)),
  ]);

  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const course = this.course();
    return (this.resources() ?? []).filter(
      (resource) =>
        (!course || resource.courseTitle === course) &&
        (!query ||
          resource.title.toLowerCase().includes(query) ||
          resource.filename.toLowerCase().includes(query) ||
          (resource.description ?? '').toLowerCase().includes(query)),
    );
  });

  protected icon(resource: LearningResource): string {
    return fileIcon(resource.contentType);
  }
}
