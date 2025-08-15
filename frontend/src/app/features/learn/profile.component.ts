import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '@core/auth.service';
import { NotificationService } from '@core/notification.service';
import { InitialsPipe } from '@shared/format';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { newPassword, confirmPassword } = group.value as { newPassword: string; confirmPassword: string };
  return newPassword && newPassword !== confirmPassword ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, DatePipe, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>My profile</h1>
        <p>Your account information and security settings.</p>
      </div>
    </div>

    <div class="grid grid--2">
      @if (auth.user(); as user) {
        <div class="card">
          <div class="card__body stack">
            <div class="row">
              <span class="avatar avatar--lg">{{ user.fullName | initials }}</span>
              <div>
                <h3 class="mb-0">{{ user.fullName }}</h3>
                <span class="text-muted">{{ user.email }}</span>
              </div>
            </div>
            <dl class="details">
              <dt>Role</dt>
              <dd>
                <span class="badge badge--brand">{{ user.role }}</span>
              </dd>
              <dt>Member since</dt>
              <dd>{{ user.createdAt | date: 'longDate' }}</dd>
            </dl>
            <p class="text-muted text-sm mb-0">
              To change your name or email address, please contact the administration.
            </p>
          </div>
        </div>
      }

      <div class="card">
        <div class="card__header"><h3>Change password</h3></div>
        <form class="card__body" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="current">Current password</label>
            <input
              id="current"
              class="input"
              type="password"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
          </div>
          <div class="field">
            <label for="new">New password</label>
            <input id="new" class="input" type="password" formControlName="newPassword" autocomplete="new-password" />
            <span class="hint">At least 8 characters.</span>
          </div>
          <div class="field">
            <label for="confirm">Confirm new password</label>
            <input
              id="confirm"
              class="input"
              type="password"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
            @if (form.hasError('mismatch') && form.controls.confirmPassword.touched) {
              <span class="error">The passwords do not match.</span>
            }
          </div>
          <button class="btn btn--primary" type="submit" [disabled]="saving() || form.invalid">
            @if (saving()) {
              <span class="spinner spinner--sm"></span>
            }
            Update password
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .avatar--lg {
      width: 56px;
      height: 56px;
      font-size: 1.1rem;
    }
    .details {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 10px;
      margin: 0;
      dt {
        color: var(--muted);
      }
      dd {
        margin: 0;
      }
    }
  `,
})
export default class ProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  protected readonly saving = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    // Refresh the cached profile (role or name may have been changed by an administrator).
    this.auth.refreshProfile().subscribe({ error: () => undefined });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.notifications.success('Your password has been updated.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(error);
      },
    });
  }
}
