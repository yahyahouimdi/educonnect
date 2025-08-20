import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, combineLatest, debounceTime, EMPTY, switchMap } from 'rxjs';
import { AdminApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { Page, Role, User } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { InitialsPipe } from '@shared/format';
import { ModalComponent } from '@shared/modal.component';
import { PagerComponent } from '@shared/pager.component';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ADMIN', label: 'Administrator' },
];

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, InitialsPipe, ModalComponent, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Users</h1>
        <p>Manage student, teacher and administrator accounts.</p>
      </div>
      <button class="btn btn--primary" type="button" (click)="openDialog('new')">
        <i class="bi bi-person-plus"></i> New user
      </button>
    </div>

    <div class="card">
      <div class="card__header filters">
        <div class="input-icon search">
          <i class="bi bi-search"></i>
          <input
            class="input"
            type="search"
            placeholder="Search by name or email…"
            aria-label="Search users"
            [ngModel]="search()"
            (ngModelChange)="search.set($event); page.set(0)"
          />
        </div>
        <select
          class="select role-filter"
          aria-label="Filter by role"
          [ngModel]="role()"
          (ngModelChange)="role.set($event); page.set(0)"
        >
          <option value="">All roles</option>
          @for (option of roles; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>

      @if (users(); as users) {
        @if (users.content.length === 0) {
          <div class="empty">
            <i class="bi bi-people"></i>
            <p>No users match your search.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th class="actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (user of users.content; track user.id) {
                  <tr>
                    <td>
                      <div class="row user">
                        <span class="avatar">{{ user.fullName | initials }}</span>
                        <div>
                          <strong>{{ user.fullName }}</strong>
                          <div class="text-muted text-sm">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        class="badge"
                        [class.badge--brand]="user.role === 'ADMIN'"
                        [class.badge--info]="user.role === 'TEACHER'"
                      >
                        {{ roleLabel(user.role) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class.badge--success]="user.enabled" [class.badge--danger]="!user.enabled">
                        {{ user.enabled ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td class="text-muted">{{ user.createdAt | date: 'mediumDate' }}</td>
                    <td class="actions">
                      <button class="icon-btn" type="button" aria-label="Edit" (click)="openDialog(user)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      @if (user.id !== auth.user()?.id) {
                        <button
                          class="icon-btn icon-btn--danger"
                          type="button"
                          aria-label="Delete"
                          (click)="remove(user)"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [page]="users.page" [totalPages]="users.totalPages" (pageChange)="page.set($event)" />
        }
      } @else {
        <div class="loading"><span class="spinner"></span></div>
      }
    </div>

    @if (dialog(); as target) {
      <app-modal [title]="target === 'new' ? 'New user' : 'Edit user'" (closed)="dialog.set(null)">
        <form id="user-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="field">
            <label for="user-name">Full name</label>
            <input id="user-name" class="input" formControlName="fullName" autocomplete="off" />
          </div>
          <div class="field">
            <label for="user-email">Email</label>
            <input id="user-email" class="input" type="email" formControlName="email" autocomplete="off" />
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="user-role">Role</label>
              <select id="user-role" class="select" formControlName="role">
                @for (option of roles; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label for="user-password">{{ target === 'new' ? 'Password' : 'New password' }}</label>
              <input
                id="user-password"
                class="input"
                type="text"
                formControlName="password"
                autocomplete="new-password"
              />
              <span class="hint">{{
                target === 'new' ? 'At least 8 characters.' : 'Leave empty to keep the current one.'
              }}</span>
            </div>
          </div>
          @if (target !== 'new') {
            <label class="check"><input type="checkbox" formControlName="enabled" /> Account enabled</label>
          }
        </form>
        <ng-container modal-footer>
          <button class="btn btn--ghost" type="button" (click)="dialog.set(null)">Cancel</button>
          <button class="btn btn--primary" type="submit" form="user-form" [disabled]="form.invalid || saving()">
            {{ target === 'new' ? 'Create user' : 'Save changes' }}
          </button>
        </ng-container>
      </app-modal>
    }
  `,
  styles: `
    .filters {
      flex-wrap: wrap;
    }
    .search {
      flex: 1;
      max-width: 420px;
      min-width: 220px;
    }
    .role-filter {
      width: auto;
      min-width: 160px;
    }
    .user {
      flex-wrap: nowrap;
    }
  `,
})
export default class UsersComponent {
  private readonly api = inject(AdminApi);
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roles = ROLE_OPTIONS;
  protected readonly search = signal('');
  protected readonly role = signal<Role | ''>('');
  protected readonly page = signal(0);
  protected readonly users = signal<Page<User> | null>(null);
  protected readonly dialog = signal<User | 'new' | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.control<Role>('STUDENT'),
    password: [''],
    enabled: [true],
  });

  constructor() {
    combineLatest([toObservable(this.search), toObservable(this.role), toObservable(this.page)])
      .pipe(
        debounceTime(250),
        switchMap(([search, role, page]) =>
          this.api.users({ search, role, page }).pipe(
            catchError((error) => {
              this.notifications.error(error);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((users) => this.users.set(users));
  }

  protected roleLabel(role: Role): string {
    return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
  }

  protected openDialog(target: User | 'new'): void {
    const password = this.form.controls.password;
    if (target === 'new') {
      this.form.reset({ fullName: '', email: '', role: 'STUDENT', password: '', enabled: true });
      password.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      this.form.reset({
        fullName: target.fullName,
        email: target.email,
        role: target.role,
        password: '',
        enabled: target.enabled,
      });
      password.setValidators([Validators.minLength(8)]);
    }
    password.updateValueAndValidity();
    this.dialog.set(target);
  }

  protected save(): void {
    const target = this.dialog();
    if (!target || this.form.invalid) return;
    const value = this.form.getRawValue();
    const request = { ...value, password: value.password || null };
    const call = target === 'new' ? this.api.createUser(request) : this.api.updateUser(target.id, request);

    this.saving.set(true);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialog.set(null);
        this.notifications.success(target === 'new' ? 'User created.' : 'User updated.');
        this.reload();
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected async remove(user: User): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete user?',
      message: `${user.fullName}'s account and learning progress will be permanently deleted. You can disable the account instead to keep its history.`,
      confirmLabel: 'Delete user',
    });
    if (!confirmed) return;
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.notifications.success('User deleted.');
        this.reload();
      },
      error: (error) => this.notifications.error(error),
    });
  }

  private reload(): void {
    this.api
      .users({ search: this.search(), role: this.role(), page: this.page() })
      .subscribe((users) => this.users.set(users));
  }
}
