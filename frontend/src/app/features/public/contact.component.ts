import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicApi } from '@core/api.service';
import { errorMessage } from '@core/notification.service';
import { SiteService } from '@core/site.service';
import { PageBannerComponent } from '@shared/page-banner.component';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, PageBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-banner
      eyebrow="Contact"
      title="Contact us"
      subtitle="Questions about admissions, programs or student life? Send us a message and we will get back to you."
    />

    <section class="section">
      <div class="container contact">
        <div class="stack">
          @if (site.info().address) {
            <div class="card">
              <div class="card__body stat">
                <span class="stat__icon"><i class="bi bi-geo-alt"></i></span>
                <div>
                  <div class="stat__label">Address</div>
                  <strong>{{ site.info().address }}</strong>
                </div>
              </div>
            </div>
          }
          @if (site.info().phone) {
            <div class="card">
              <div class="card__body stat">
                <span class="stat__icon"><i class="bi bi-telephone"></i></span>
                <div>
                  <div class="stat__label">Phone</div>
                  <strong>{{ site.info().phone }}</strong>
                </div>
              </div>
            </div>
          }
          @if (site.info().email; as email) {
            <div class="card">
              <div class="card__body stat">
                <span class="stat__icon"><i class="bi bi-envelope"></i></span>
                <div>
                  <div class="stat__label">Email</div>
                  <a [href]="'mailto:' + email"
                    ><strong>{{ email }}</strong></a
                  >
                </div>
              </div>
            </div>
          }
        </div>

        <div class="card">
          <div class="card__body">
            @if (sent()) {
              <div class="empty">
                <i class="bi bi-check-circle" style="color: var(--success)"></i>
                <h3>Thank you!</h3>
                <p>Your message has been sent. We will reply as soon as possible.</p>
                <button class="btn btn--soft" type="button" (click)="sent.set(false)">Send another message</button>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
                <h3>Send a message</h3>
                @if (error()) {
                  <div class="alert alert--danger mt-2"><i class="bi bi-exclamation-circle"></i> {{ error() }}</div>
                }
                <div class="form-grid mt-2">
                  <div class="field">
                    <label for="name">Full name</label>
                    <input id="name" class="input" formControlName="name" autocomplete="name" />
                  </div>
                  <div class="field">
                    <label for="email">Email</label>
                    <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
                    @if (form.controls.email.touched && form.controls.email.invalid) {
                      <span class="error">Please enter a valid email address.</span>
                    }
                  </div>
                </div>
                <div class="field">
                  <label for="subject">Subject</label>
                  <input id="subject" class="input" formControlName="subject" />
                </div>
                <div class="field">
                  <label for="message">Message</label>
                  <textarea id="message" class="textarea" rows="6" formControlName="message"></textarea>
                </div>
                <!-- Honeypot field: hidden from people, often filled in by spam bots. -->
                <input class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true" formControlName="website" />
                <button class="btn btn--primary btn--lg" type="submit" [disabled]="sending()">
                  @if (sending()) {
                    <span class="spinner spinner--sm"></span>
                  } @else {
                    <i class="bi bi-send"></i>
                  }
                  Send message
                </button>
              </form>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .contact {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .contact {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class ContactComponent {
  private readonly api = inject(PublicApi);
  protected readonly site = inject(SiteService);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
    website: [''],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in all fields.');
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.api.contact(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
