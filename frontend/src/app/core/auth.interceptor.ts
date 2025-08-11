import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Adds the bearer token to API calls and signs the user out when the server rejects it. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const isApiCall = request.url.startsWith('/api/');

  const authorized = token && isApiCall ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const isLogin = request.url.endsWith('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && token && !isLogin) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
