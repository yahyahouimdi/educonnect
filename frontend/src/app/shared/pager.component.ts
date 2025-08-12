import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          [disabled]="page() === 0"
          (click)="pageChange.emit(page() - 1)"
        >
          <i class="bi bi-chevron-left"></i> Previous
        </button>
        <span class="text-muted">Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          [disabled]="page() + 1 >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
        >
          Next <i class="bi bi-chevron-right"></i>
        </button>
      </nav>
    }
  `,
})
export class PagerComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}
