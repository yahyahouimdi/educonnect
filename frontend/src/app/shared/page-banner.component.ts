import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Title band shown at the top of inner pages of the public website. */
@Component({
  selector: 'app-page-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="banner">
      <div class="container">
        @if (eyebrow()) {
          <span class="banner__eyebrow">{{ eyebrow() }}</span>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    .banner {
      padding: 56px 0 48px;
      color: #fff;
      background: linear-gradient(135deg, var(--brand-900), var(--brand-700));
    }
    h1 {
      color: #fff;
      margin-bottom: 10px;
    }
    p {
      max-width: 680px;
      margin: 0;
      font-size: 1.08rem;
      color: rgb(255 255 255 / 78%);
    }
    .banner__eyebrow {
      display: inline-block;
      margin-bottom: 10px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgb(255 255 255 / 70%);
    }
  `,
})
export class PageBannerComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>();
  readonly eyebrow = input<string | undefined>();
}
