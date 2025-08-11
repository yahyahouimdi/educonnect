import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Role, User } from './models';

const STORAGE_KEY = 'educonnect.session';

interface StoredSession {
  token: string;
  expiresAt: string;
  user: User;
}

/** Holds the signed-in user and access token, persisted in localStorage across reloads. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<StoredSession | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isStaff = computed(() => this.hasRole('ADMIN', 'TEACHER'));
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));

  get token(): string | null {
    const session = this.session();
    if (session && new Date(session.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return null;
    }
    return session?.token ?? null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/login', { email, password })
      .pipe(
        tap((response) =>
          this.store({ token: response.accessToken, expiresAt: response.expiresAt, user: response.user }),
        ),
      );
  }

  refreshProfile(): Observable<User> {
    return this.http.get<User>('/api/v1/auth/me').pipe(
      tap((user) => {
        const session = this.session();
        if (session) {
          this.store({ ...session, user });
        }
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>('/api/v1/auth/me/password', { currentPassword, newPassword });
  }

  logout(redirect = true): void {
    this.clear();
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.user();
    return !!user && roles.includes(user.role);
  }

  /** Where a user lands after signing in. */
  homeRoute(): string {
    return this.isStaff() ? '/admin' : '/app';
  }

  private store(session: StoredSession): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage may be unavailable (private mode); the session then lasts for the tab only.
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as StoredSession;
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  } catch {
    return null;
  }
}
