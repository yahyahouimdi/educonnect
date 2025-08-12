import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/** Simple accessible dialog: projects a body and an optional `[modal-footer]` slot. */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div
        class="modal"
        [class.modal--lg]="size() === 'lg'"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
      >
        <div class="modal__header">
          <h3>{{ title() }}</h3>
          <button class="icon-btn" type="button" aria-label="Close" (click)="closed.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal__body">
          <ng-content />
        </div>
        <div class="modal__footer">
          <ng-content select="[modal-footer]" />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
