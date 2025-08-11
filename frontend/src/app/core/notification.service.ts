import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ProblemDetail } from './models';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (confirmed: boolean) => void;
}

/** Toast notifications and confirmation dialogs, rendered once by the root component. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;

  readonly toasts = signal<Toast[]>([]);
  readonly confirmation = signal<ConfirmRequest | null>(null);

  success(message: string): void {
    this.push('success', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  error(error: unknown, fallback = 'Something went wrong. Please try again.'): void {
    this.push('error', errorMessage(error, fallback));
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  confirm(options: { title: string; message: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        danger: options.danger ?? true,
        resolve: (confirmed) => {
          this.confirmation.set(null);
          resolve(confirmed);
        },
      });
    });
  }

  private push(kind: Toast['kind'], message: string): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this.toasts.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.dismiss(toast.id), kind === 'error' ? 6000 : 3500);
  }
}

/** Extracts a human-readable message from an API error (RFC 9457 problem details). */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    const problem = error.error as ProblemDetail | null;
    if (problem?.errors) {
      const [field, message] = Object.entries(problem.errors)[0] ?? [];
      if (field) {
        return `${humanize(field)} ${message}`;
      }
    }
    if (problem?.detail) {
      return problem.detail;
    }
  }
  return fallback;
}

function humanize(field: string): string {
  const words = field.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
