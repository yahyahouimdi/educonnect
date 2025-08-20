import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '@core/notification.service';
import { applyBrandColor, SiteService } from '@core/site.service';
import { SiteSettingsRequest } from '@core/models';
import { BrandComponent } from '@shared/brand.component';

const URL_PATTERN = /^https?:\/\/.+/;

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 76px;
    }
    .logo-preview {
      display: grid;
      place-items: center;
      padding: 24px;
      border-radius: var(--radius);
      background: var(--surface-2);
      border: 1px solid var(--line);
    }
    .swatches {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
      button {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid var(--surface);
        box-shadow: 0 0 0 1px var(--line-strong);
        cursor: pointer;
      }
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }
      aside {
        position: static;
      }
    }
  `,
})
export default class SettingsComponent {
  protected readonly site = inject(SiteService);
  private readonly notifications = inject(NotificationService);
  private readonly logoInput = viewChild<ElementRef<HTMLInputElement>>('logoInput');

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly swatches = [
    '#1d4ed8',
    '#0f766e',
    '#7c3aed',
    '#b91c1c',
    '#c2410c',
    '#15803d',
    '#0369a1',
    '#334155',
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    shortName: ['', [Validators.required, Validators.maxLength(50)]],
    tagline: [''],
    about: [''],
    email: ['', Validators.email],
    phone: [''],
    address: [''],
    website: ['', Validators.pattern(URL_PATTERN)],
    primaryColor: ['#1d4ed8', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    facebookUrl: ['', Validators.pattern(URL_PATTERN)],
    linkedinUrl: ['', Validators.pattern(URL_PATTERN)],
    xUrl: ['', Validators.pattern(URL_PATTERN)],
    youtubeUrl: ['', Validators.pattern(URL_PATTERN)],
  });

  constructor() {
    const info = this.site.info();
    this.form.reset({
      name: info.name,
      shortName: info.shortName,
      tagline: info.tagline ?? '',
      about: info.about ?? '',
      email: info.email ?? '',
      phone: info.phone ?? '',
      address: info.address ?? '',
      website: info.website ?? '',
      primaryColor: info.primaryColor,
      facebookUrl: info.social.facebook ?? '',
      linkedinUrl: info.social.linkedin ?? '',
      xUrl: info.social.x ?? '',
      youtubeUrl: info.social.youtube ?? '',
    });

    // Live preview of the brand color while editing.
    this.form.controls.primaryColor.valueChanges.pipe(takeUntilDestroyed()).subscribe((color) => {
      if (/^#[0-9a-fA-F]{6}$/.test(color)) applyBrandColor(document.documentElement, color);
    });
    // Leaving without saving restores the saved color.
    inject(DestroyRef).onDestroy(() => applyBrandColor(document.documentElement, this.site.info().primaryColor));
  }

  protected pickColor(color: string): void {
    this.form.controls.primaryColor.setValue(color);
    this.form.markAsDirty();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request = Object.fromEntries(
      Object.entries(value).map(([key, field]) => [
        key,
        typeof field === 'string' && field.trim() === '' ? null : field,
      ]),
    ) as unknown as SiteSettingsRequest;

    this.saving.set(true);
    this.site.update(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.notifications.success('Institution settings saved.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.site.uploadLogo(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.notifications.success('Logo updated.');
        const input = this.logoInput()?.nativeElement;
        if (input) input.value = '';
      },
      error: (error) => {
        this.uploading.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected removeLogo(): void {
    this.site.removeLogo().subscribe({
      next: () => this.notifications.success('Logo removed.'),
      error: (error) => this.notifications.error(error),
    });
  }
}
