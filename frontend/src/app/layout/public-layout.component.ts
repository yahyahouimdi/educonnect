import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '@core/auth.service';
import { SiteService } from '@core/site.service';
import { BrandComponent } from '@shared/brand.component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  protected readonly site = inject(SiteService);
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly links = [
    { path: '/', label: 'Home', exact: true },
    { path: '/about', label: 'About', exact: false },
    { path: '/programs', label: 'Programs', exact: false },
    { path: '/news', label: 'News', exact: false },
    { path: '/contact', label: 'Contact', exact: false },
  ];

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}
