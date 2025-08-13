import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';
import { PageBannerComponent } from '@shared/page-banner.component';

@Component({
  selector: 'app-about',
  imports: [RouterLink, MarkdownPipe, PageBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-banner eyebrow="About us" [title]="site.info().name" [subtitle]="site.info().tagline" />

    <section class="section">
      <div class="container about">
        <article class="prose about__text" [innerHTML]="site.info().about | markdown"></article>

        <aside class="card about__facts">
          <div class="card__body stack">
            <h3>Get in touch</h3>
            @if (site.info().address) {
              <div class="fact"><i class="bi bi-geo-alt"></i> {{ site.info().address }}</div>
            }
            @if (site.info().phone) {
              <div class="fact"><i class="bi bi-telephone"></i> {{ site.info().phone }}</div>
            }
            @if (site.info().email; as email) {
              <div class="fact">
                <i class="bi bi-envelope"></i> <a [href]="'mailto:' + email">{{ email }}</a>
              </div>
            }
            @if (site.info().website; as website) {
              <div class="fact">
                <i class="bi bi-globe2"></i> <a [href]="website" target="_blank" rel="noopener">{{ website }}</a>
              </div>
            }
            <a routerLink="/contact" class="btn btn--primary btn--block">Send us a message</a>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head section-head--center">
          <span class="eyebrow">Our values</span>
          <h2>What drives us</h2>
        </div>
        <div class="grid grid--3">
          @for (value of values; track value.title) {
            <div class="card">
              <div class="card__body">
                <span class="stat__icon"><i [class]="'bi ' + value.icon"></i></span>
                <h3 class="mt-2">{{ value.title }}</h3>
                <p class="text-muted mb-0">{{ value.text }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .about {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 48px;
      align-items: start;
    }
    .about__text {
      font-size: 1.05rem;
    }
    .fact {
      display: flex;
      gap: 10px;
      color: var(--ink-2);
      i {
        color: var(--brand);
      }
    }
    @media (max-width: 860px) {
      .about {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class AboutComponent {
  protected readonly site = inject(SiteService);

  protected readonly values = [
    {
      icon: 'bi-award',
      title: 'Excellence',
      text: 'Demanding, up-to-date programs taught by committed and qualified teachers.',
    },
    {
      icon: 'bi-universal-access',
      title: 'Accessibility',
      text: 'Learning material available online, anytime, so every student can progress at their own pace.',
    },
    {
      icon: 'bi-people',
      title: 'Community',
      text: 'A connected campus where students and teachers exchange ideas and help each other.',
    },
  ];
}
