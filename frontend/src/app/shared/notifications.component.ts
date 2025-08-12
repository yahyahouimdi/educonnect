import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { NotificationService } from '@core/notification.service';

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div [class]="'toast toast--' + toast.kind" role="status">
          <i
            class="bi"
            [class.bi-check-circle-fill]="toast.kind === 'success'"
            [class.bi-exclamation-octagon-fill]="toast.kind === 'error'"
            [class.bi-info-circle-fill]="toast.kind === 'info'"
          ></i>
          <span>{{ toast.message }}</span>
          <button class="icon-btn" type="button" aria-label="Dismiss" (click)="notifications.dismiss(toast.id)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      }
    </div>

    @if (notifications.confirmation(); as request) {
      <div class="modal-backdrop" (click)="request.resolve(false)">
        <div
          class="modal modal--sm"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="request.title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal__body">
            <h3>{{ request.title }}</h3>
            <p class="text-muted">{{ request.message }}</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" type="button" (click)="request.resolve(false)">Cancel</button>
            <button
              class="btn"
              type="button"
              [class.btn--danger]="request.danger"
              [class.btn--primary]="!request.danger"
              (click)="request.resolve(true)"
            >
              {{ request.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class NotificationsComponent {
  protected readonly notifications = inject(NotificationService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.notifications.confirmation()?.resolve(false);
  }
}
