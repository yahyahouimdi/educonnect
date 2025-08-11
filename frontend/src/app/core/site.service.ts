import { HttpClient } from '@angular/common/http';
import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { catchError, firstValueFrom, Observable, of, tap } from 'rxjs';
import { SiteInfo, SiteSettingsRequest } from './models';

const FALLBACK: SiteInfo = {
  name: 'EduConnect',
  shortName: 'EduConnect',
  primaryColor: '#1d4ed8',
  social: {},
  features: { assistant: false },
};

/**
 * Institution branding loaded once at startup. Everything that identifies the institution (name,
 * logo, colors, contact details) comes from here, so the same build serves any institution.
 */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);

  readonly info = signal<SiteInfo>(FALLBACK);

  load(): Promise<unknown> {
    return firstValueFrom(
      this.http.get<SiteInfo>('/api/v1/site').pipe(
        tap((info) => this.apply(info)),
        catchError(() => {
          this.apply(FALLBACK);
          return of(null);
        }),
      ),
    );
  }

  update(request: SiteSettingsRequest): Observable<SiteInfo> {
    return this.http.put<SiteInfo>('/api/v1/admin/site', request).pipe(tap((info) => this.apply(info)));
  }

  uploadLogo(file: File): Observable<SiteInfo> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<SiteInfo>('/api/v1/admin/site/logo', form).pipe(tap((info) => this.apply(info)));
  }

  removeLogo(): Observable<SiteInfo> {
    return this.http.delete<SiteInfo>('/api/v1/admin/site/logo').pipe(tap((info) => this.apply(info)));
  }

  /** Sets the browser tab title as "Page · Institution". */
  setPageTitle(page?: string): void {
    const name = this.info().shortName || this.info().name;
    this.title.setTitle(page ? `${page} · ${name}` : this.info().name);
  }

  private apply(info: SiteInfo): void {
    this.info.set(info);
    this.title.setTitle(info.name);
    applyBrandColor(this.document.documentElement, info.primaryColor);
    this.updateFavicon(info.logoUrl);
  }

  private updateFavicon(logoUrl?: string): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = logoUrl ?? 'favicon.svg';
    }
  }
}

/** Derives a small palette from the institution color and exposes it as CSS custom properties. */
export function applyBrandColor(root: HTMLElement, hex: string): void {
  const rgb = parseHex(hex) ?? parseHex(FALLBACK.primaryColor)!;
  const shades: Record<string, [number, number, number]> = {
    '--brand': rgb,
    '--brand-50': mix(rgb, [255, 255, 255], 0.94),
    '--brand-100': mix(rgb, [255, 255, 255], 0.86),
    '--brand-200': mix(rgb, [255, 255, 255], 0.7),
    '--brand-600': mix(rgb, [0, 0, 0], 0.12),
    '--brand-700': mix(rgb, [0, 0, 0], 0.25),
    '--brand-900': mix(rgb, [0, 0, 0], 0.55),
  };
  for (const [name, value] of Object.entries(shades)) {
    root.style.setProperty(name, `rgb(${value.join(' ')})`);
  }
  root.style.setProperty('--brand-rgb', rgb.join(' '));
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex?.trim() ?? '');
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null;
}

function mix(color: [number, number, number], target: [number, number, number], amount: number) {
  return color.map((channel, i) => Math.round(channel + (target[i] - channel) * amount)) as [number, number, number];
}
