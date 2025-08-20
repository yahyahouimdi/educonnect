import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AdminApi } from '@core/api.service';
import { ContactMessage, Page } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { PagerComponent } from '@shared/pager.component';

@Component({
  selector: 'app-messages',
  imports: [DatePipe, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Messages</h1>
        <p>Messages sent by visitors through the contact form.</p>
      </div>
    </div>

    <div class="card">
      @if (messages(); as messages) {
        @if (messages.content.length === 0) {
          <div class="empty">
            <i class="bi bi-inbox"></i>
            <h3>Inbox is empty</h3>
            <p>New contact requests will appear here.</p>
          </div>
        } @else {
          <ul class="inbox">
            @for (message of messages.content; track message.id) {
              <li class="inbox__item" [class.inbox__item--unread]="!message.read">
                <button class="inbox__summary" type="button" (click)="toggle(message)">
                  <span class="inbox__dot" aria-hidden="true"></span>
                  <span class="inbox__from">
                    <strong>{{ message.name }}</strong>
                    <span class="text-muted text-sm">{{ message.email }}</span>
                  </span>
                  <span class="inbox__subject truncate">{{ message.subject }}</span>
                  <time class="text-muted text-sm">{{ message.createdAt | date: 'short' }}</time>
                </button>
                @if (expanded() === message.id) {
                  <div class="inbox__body">
                    <p>{{ message.message }}</p>
                    <div class="row">
                      <a class="btn btn--primary btn--sm" [href]="replyLink(message)"
                        ><i class="bi bi-reply"></i> Reply by email</a
                      >
                      <button class="btn btn--sm" type="button" (click)="setRead(message, !message.read)">
                        {{ message.read ? 'Mark as unread' : 'Mark as read' }}
                      </button>
                      <span class="spacer"></span>
                      <button class="btn btn--ghost btn--sm" type="button" (click)="remove(message)">
                        <i class="bi bi-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                }
              </li>
            }
          </ul>
          <app-pager [page]="messages.page" [totalPages]="messages.totalPages" (pageChange)="load($event)" />
        }
      } @else {
        <div class="loading"><span class="spinner"></span></div>
      }
    </div>
  `,
  styles: `
    .inbox {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .inbox__item {
      border-bottom: 1px solid var(--line);
      &:last-child {
        border-bottom: 0;
      }
      &--unread {
        .inbox__dot {
          background: var(--brand);
        }
        .inbox__subject {
          font-weight: 700;
        }
      }
    }
    .inbox__summary {
      display: grid;
      grid-template-columns: 10px 220px 1fr auto;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 22px;
      border: 0;
      background: none;
      font: inherit;
      text-align: left;
      color: var(--ink);
      cursor: pointer;
      &:hover {
        background: var(--surface-2);
      }
    }
    .inbox__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .inbox__from {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.3;
    }
    .inbox__body {
      padding: 0 22px 18px 46px;
      p {
        white-space: pre-wrap;
        color: var(--ink-2);
      }
    }
    @media (max-width: 760px) {
      .inbox__summary {
        grid-template-columns: 10px 1fr;
        .inbox__subject,
        time {
          grid-column: 2;
        }
      }
      .inbox__body {
        padding-left: 22px;
      }
    }
  `,
})
export default class MessagesComponent {
  private readonly api = inject(AdminApi);
  private readonly notifications = inject(NotificationService);

  protected readonly messages = signal<Page<ContactMessage> | null>(null);
  protected readonly expanded = signal<number | null>(null);

  constructor() {
    this.load(0);
  }

  protected load(page: number): void {
    this.api.messages(page).subscribe({
      next: (messages) => this.messages.set(messages),
      error: (error) => this.notifications.error(error),
    });
  }

  protected toggle(message: ContactMessage): void {
    const opening = this.expanded() !== message.id;
    this.expanded.set(opening ? message.id : null);
    if (opening && !message.read) {
      this.setRead(message, true);
    }
  }

  protected setRead(message: ContactMessage, read: boolean): void {
    this.api.markMessage(message.id, read).subscribe({
      next: (updated) => this.replace(updated),
      error: (error) => this.notifications.error(error),
    });
  }

  protected replyLink(message: ContactMessage): string {
    return `mailto:${message.email}?subject=${encodeURIComponent('Re: ' + message.subject)}`;
  }

  protected async remove(message: ContactMessage): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: 'Delete message?',
      message: `The message from ${message.name} will be permanently deleted.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.api.deleteMessage(message.id).subscribe({
      next: () => this.load(this.messages()?.page ?? 0),
      error: (error) => this.notifications.error(error),
    });
  }

  private replace(updated: ContactMessage): void {
    this.messages.update((page) =>
      page ? { ...page, content: page.content.map((m) => (m.id === updated.id ? updated : m)) } : page,
    );
  }
}
