import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth.service';
import { errorMessage } from '@core/notification.service';
import { SiteService } from '@core/site.service';
import { BrandComponent } from '@shared/brand.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="login">
      <div class="card login__card">
        <div class="card__body">
          <div class="text-center login__head">
            <app-brand [showName]="false" />
            <h2>Welcome back</h2>
            <p class="text-muted">Sign in to the {{ site.info().shortName }} digital campus.</p>
          </div>

          @if (error()) {
            <div class="alert alert--danger" role="alert"><i class="bi bi-exclamation-circle"></i> {{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="mt-2">
            <div class="field">
              <label for="email">Email</label>
              <div class="input-icon">
                <i class="bi bi-envelope"></i>
                <input
                  id="email"
                  class="input"
                  type="email"
                  formControlName="email"
                  autocomplete="username"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div class="field">
              <label for="password">Password</label>
              <div class="input-icon password">
                <i class="bi bi-lock"></i>
                <input
                  id="password"
                  class="input"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                />
                <button
                  class="icon-btn password__toggle"
                  type="button"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  (click)="showPassword.set(!showPassword())"
                >
                  <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                </button>
              </div>
            </div>
            <button class="btn btn--primary btn--lg btn--block" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner spinner--sm"></span>
              }
              Sign in
            </button>
          </form>
          <p class="text-muted text-sm text-center mt-3 mb-0">
            Accounts are created by the administration. Forgot your password? Contact your administrator.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .login {
      min-height: calc(100vh - var(--header-h));
      display: grid;
      place-items: center;
      padding: 48px 16px;
      background: radial-gradient(circle at top, var(--brand-50), var(--surface) 60%);
    }
    .login__card {
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
      .card__body {
        padding: 36px 32px;
      }
    }
    .login__head {
      margin-bottom: 20px;
      :first-child {
        justify-content: center;
        margin-bottom: 16px;
      }
      h2 {
        margin-bottom: 4px;
      }
    }
    .password .input {
      padding-right: 44px;
    }
    .password__toggle {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      i {
        position: static;
        transform: none;
      }
    }
  `,
})
export default class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly site = inject(SiteService);

  /** Bound from the `?redirect=` query parameter set by the auth guards. */
  readonly redirect = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const redirect = this.redirect();
        // Only follow same-site relative paths to avoid open redirects.
        const target = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : this.auth.homeRoute();
        void this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'Unable to sign in. Please try again.'));
      },
    });
  }
}
