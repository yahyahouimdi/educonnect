import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, Role } from './models';

function response(role: Role, expiresInMs = 60_000): AuthResponse {
  return {
    accessToken: 'token-123',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    user: { id: 1, fullName: 'Ada Lovelace', email: 'ada@example.com', role, enabled: true, createdAt: '' },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the session after a successful login', () => {
    service.login('ada@example.com', 'secret').subscribe();
    http.expectOne('/api/v1/auth/login').flush(response('STUDENT'));

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token).toBe('token-123');
    expect(service.user()?.fullName).toBe('Ada Lovelace');
    expect(localStorage.getItem('educonnect.session')).toContain('token-123');
  });

  it('routes students to the learning space and staff to the console', () => {
    service.login('a', 'b').subscribe();
    http.expectOne('/api/v1/auth/login').flush(response('STUDENT'));
    expect(service.homeRoute()).toBe('/app');

    service.login('a', 'b').subscribe();
    http.expectOne('/api/v1/auth/login').flush(response('TEACHER'));
    expect(service.homeRoute()).toBe('/admin');
    expect(service.isStaff()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  });

  it('drops expired tokens', () => {
    service.login('a', 'b').subscribe();
    http.expectOne('/api/v1/auth/login').flush(response('ADMIN', -1000));

    expect(service.token).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('clears the session on logout', () => {
    service.login('a', 'b').subscribe();
    http.expectOne('/api/v1/auth/login').flush(response('ADMIN'));

    service.logout(false);

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('educonnect.session')).toBeNull();
  });
});
