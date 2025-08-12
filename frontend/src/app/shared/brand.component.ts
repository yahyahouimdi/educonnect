import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SiteService } from '@core/site.service';
import { InitialsPipe } from './format';

/** Institution logo (uploaded image, or initials on a brand-colored badge) with optional name. */
@Component({
  selector: 'app-brand',
  imports: [InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (site.info().logoUrl; as logo) {
      <img class="brand__logo" [src]="logo" [alt]="site.info().name + ' logo'" />
    } @else {
      <span class="brand__mark" aria-hidden="true">{{ site.info().shortName | initials }}</span>
    }
    @if (showName()) {
      <span class="brand__text">
        <strong>{{ site.info().shortName }}</strong>
        @if (subtitle()) {
          <small>{{ subtitle() }}</small>
        }
      </span>
    }
  `,
  host: { class: 'brand', '[class.brand--inverse]': 'inverse()' },
})
export class BrandComponent {
  protected readonly site = inject(SiteService);

  readonly showName = input(true);
  readonly inverse = input(false);
  readonly caption = input<string | null>(null);

  protected readonly subtitle = computed(() => this.caption() ?? this.site.info().tagline ?? '');
}
