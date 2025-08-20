import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi, LearningApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { CourseAdmin, LearningResource } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { fileIcon, FileSizePipe } from '@shared/format';

@Component({
  selector: 'app-resources-admin',
  imports: [ReactiveFormsModule, DatePipe, FileSizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Resources</h1>
        <p>Upload documents that students can download from their learning space.</p>
      </div>
    </div>

    <div class="layout">
      <form class="card" [formGroup]="form" (ngSubmit)="upload()" novalidate>
        <div class="card__header"><h3>Upload a file</h3></div>
        <div class="card__body">
          <label
            class="dropzone"
            [class.dropzone--active]="dragging()"
            (dragover)="onDrag($event, true)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
          >
            <input #fileInput type="file" class="sr-only" (change)="onFileSelected($event)" />
            <i class="bi bi-cloud-arrow-up"></i>
            @if (file(); as file) {
              <strong class="truncate">{{ file.name }}</strong>
              <span class="text-muted text-sm">{{ file.size | fileSize }} · click to change</span>
            } @else {
              <strong>Drop a file here or click to browse</strong>
              <span class="text-muted text-sm">PDF, documents, slides, images, archives…</span>
            }
          </label>
          <div class="field mt-2">
            <label for="resource-title">Title</label>
            <input id="resource-title" class="input" formControlName="title" />
          </div>
          <div class="field">
            <label for="resource-description">Description (optional)</label>
            <textarea id="resource-description" class="textarea" rows="3" formControlName="description"></textarea>
          </div>
          <div class="field">
            <label for="resource-course">Course (optional)</label>
            <select id="resource-course" class="select" formControlName="courseId">
              <option [ngValue]="null">General resource</option>
              @for (course of courses(); track course.id) {
                <option [ngValue]="course.id">{{ course.title }}</option>
              }
            </select>
          </div>
          <button class="btn btn--primary btn--block" type="submit" [disabled]="!file() || form.invalid || uploading()">
            @if (uploading()) {
              <span class="spinner spinner--sm"></span>
            } @else {
              <i class="bi bi-upload"></i>
            }
            Upload
          </button>
        </div>
      </form>

      <div class="card">
        <div class="card__header"><h3>Shared files</h3></div>
        @if (resources() === null) {
          <div class="loading"><span class="spinner"></span></div>
        } @else if (resources()!.length === 0) {
          <div class="empty">
            <i class="bi bi-folder2-open"></i>
            <p>No files have been shared yet.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Course</th>
                  <th>Uploaded</th>
                  <th class="actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (resource of resources(); track resource.id) {
                  <tr>
                    <td>
                      <div class="row file">
                        <i [class]="'bi ' + icon(resource)"></i>
                        <div>
                          <strong>{{ resource.title }}</strong>
                          <div class="text-muted text-sm">
                            {{ resource.filename }} · {{ resource.sizeBytes | fileSize }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{{ resource.courseTitle ?? '—' }}</td>
                    <td class="text-muted text-sm">
                      {{ resource.createdAt | date: 'mediumDate' }}
                      @if (resource.uploadedByName) {
                        <div>by {{ resource.uploadedByName }}</div>
                      }
                    </td>
                    <td class="actions">
                      <button
                        class="icon-btn"
                        type="button"
                        aria-label="Download"
                        (click)="learning.download(resource)"
                      >
                        <i class="bi bi-download"></i>
                      </button>
                      @if (canDelete(resource)) {
                        <button
                          class="icon-btn icon-btn--danger"
                          type="button"
                          aria-label="Delete"
                          (click)="remove(resource)"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 20px;
      align-items: start;
    }
    .dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 28px 16px;
      border: 2px dashed var(--line-strong);
      border-radius: var(--radius);
      background: var(--surface-2);
      text-align: center;
      cursor: pointer;
      max-width: 100%;
      i {
        font-size: 2rem;
        color: var(--brand);
      }
      strong {
        max-width: 100%;
      }
      &:hover,
      &--active {
        border-color: var(--brand);
        background: var(--brand-50);
      }
    }
    .file {
      flex-wrap: nowrap;
      i {
        font-size: 1.4rem;
        color: var(--brand);
      }
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class ResourcesAdminComponent {
  private readonly admin = inject(AdminApi);
  protected readonly learning = inject(LearningApi);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly resources = signal<LearningResource[] | null>(null);
  protected readonly courses = signal<CourseAdmin[]>([]);
  protected readonly file = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    courseId: this.fb.control<number | null>(null),
  });

  constructor() {
    this.load();
    this.admin.courses().subscribe((courses) => this.courses.set(courses));
  }

  protected onFileSelected(event: Event): void {
    this.setFile((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  protected onDrag(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragging.set(active);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  protected upload(): void {
    const file = this.file();
    if (!file || this.form.invalid) return;
    const { title, description, courseId } = this.form.getRawValue();
    this.uploading.set(true);
    this.admin.uploadResource(file, title, description, courseId).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file.set(null);
        this.form.reset();
        const input = this.fileInput()?.nativeElement;
        if (input) input.value = '';
        this.notifications.success('File uploaded.');
        this.load();
      },
      error: (error) => {
        this.uploading.set(false);
        this.notifications.error(error, 'The upload failed. The file may be too large.');
      },
    });
  }

  protected canDelete(resource: LearningResource): boolean {
    return this.auth.isAdmin() || resource.uploadedById === this.auth.user()?.id;
  }

  protected async remove(resource: LearningResource): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete file?',
      message: `"${resource.title}" will no longer be available to students.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.admin.deleteResource(resource.id).subscribe({
      next: () => {
        this.notifications.success('File deleted.');
        this.load();
      },
      error: (error) => this.notifications.error(error),
    });
  }

  protected icon(resource: LearningResource): string {
    return fileIcon(resource.contentType);
  }

  private setFile(file: File | null): void {
    this.file.set(file);
    if (file && !this.form.controls.title.value) {
      this.form.controls.title.setValue(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  private load(): void {
    this.learning.resources().subscribe({
      next: (resources) => this.resources.set(resources),
      error: (error) => {
        this.resources.set([]);
        this.notifications.error(error);
      },
    });
  }
}
