import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LearningApi } from '@core/api.service';
import { AssistantMessage } from '@core/models';
import { errorMessage } from '@core/notification.service';
import { SiteService } from '@core/site.service';
import { MarkdownPipe } from '@shared/markdown.pipe';

/** How many previous messages are sent to the model for context. */
const CONTEXT_WINDOW = 12;

@Component({
  selector: 'app-assistant',
  imports: [FormsModule, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>AI assistant</h1>
        <p>Ask questions about your courses and get clear explanations.</p>
      </div>
      @if (messages().length) {
        <button class="btn btn--ghost btn--sm" type="button" (click)="reset()">
          <i class="bi bi-arrow-counterclockwise"></i> New conversation
        </button>
      }
    </div>

    @if (!site.info().features.assistant) {
      <div class="card empty">
        <i class="bi bi-stars"></i>
        <h3>The assistant is not enabled</h3>
        <p>An administrator can enable it by configuring an AI API key on the server.</p>
      </div>
    } @else {
      <div class="card assistant">
        <div class="thread" #scroller>
          @if (messages().length === 0) {
            <div class="welcome">
              <span class="stat__icon"><i class="bi bi-stars"></i></span>
              <h3>How can I help you today?</h3>
              <div class="suggestions">
                @for (suggestion of suggestions; track suggestion) {
                  <button class="btn btn--soft btn--sm" type="button" (click)="ask(suggestion)">
                    {{ suggestion }}
                  </button>
                }
              </div>
            </div>
          }
          @for (message of messages(); track $index) {
            <div class="turn" [class.turn--user]="message.role === 'user'">
              <span class="turn__icon">
                <i
                  class="bi"
                  [class.bi-person]="message.role === 'user'"
                  [class.bi-stars]="message.role === 'assistant'"
                ></i>
              </span>
              @if (message.role === 'assistant') {
                <div class="turn__content prose" [innerHTML]="message.content | markdown"></div>
              } @else {
                <div class="turn__content">{{ message.content }}</div>
              }
            </div>
          }
          @if (thinking()) {
            <div class="turn">
              <span class="turn__icon"><i class="bi bi-stars"></i></span>
              <div class="turn__content typing"><span></span><span></span><span></span></div>
            </div>
          }
          @if (error()) {
            <div class="alert alert--danger"><i class="bi bi-exclamation-circle"></i> {{ error() }}</div>
          }
        </div>

        <form class="composer" (ngSubmit)="ask(draft())">
          <textarea
            class="textarea"
            name="prompt"
            rows="1"
            placeholder="Ask anything… (Shift+Enter for a new line)"
            maxlength="4000"
            [ngModel]="draft()"
            (ngModelChange)="draft.set($event)"
            (keydown.enter)="onEnter($any($event))"
            aria-label="Your question"
          ></textarea>
          <button class="btn btn--primary" type="submit" [disabled]="thinking() || !draft().trim()">
            <i class="bi bi-send"></i>
          </button>
        </form>
      </div>
      <p class="text-muted text-sm text-center mt-2">
        AI answers can contain mistakes. Check important information with your teachers.
      </p>
    }
  `,
  styles: `
    .assistant {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 250px);
      min-height: 440px;
    }
    .thread {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .welcome {
      margin: auto;
      text-align: center;
      max-width: 560px;
      .stat__icon {
        margin: 0 auto 14px;
      }
    }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      .btn {
        white-space: normal;
        text-align: left;
      }
    }
    .turn {
      display: flex;
      gap: 12px;
      max-width: 860px;
      &--user {
        flex-direction: row-reverse;
        align-self: flex-end;
        .turn__content {
          background: var(--brand);
          color: #fff;
          white-space: pre-wrap;
        }
        .turn__icon {
          background: var(--surface-3);
          color: var(--ink-2);
        }
      }
    }
    .turn__icon {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--brand-50);
      color: var(--brand);
      flex-shrink: 0;
    }
    .turn__content {
      min-width: 0;
      padding: 10px 14px;
      border-radius: 14px;
      background: var(--surface-2);
      border: 1px solid var(--line);
    }
    .typing span {
      display: inline-block;
      width: 7px;
      height: 7px;
      margin: 0 2px;
      border-radius: 50%;
      background: var(--muted);
      animation: blink 1.2s infinite ease-in-out;
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
    @keyframes blink {
      0%,
      80%,
      100% {
        opacity: 0.25;
      }
      40% {
        opacity: 1;
      }
    }
    .composer {
      display: flex;
      gap: 10px;
      padding: 14px 18px;
      border-top: 1px solid var(--line);
      .textarea {
        min-height: 44px;
        max-height: 160px;
        resize: none;
      }
      .btn {
        align-self: flex-end;
        min-height: 44px;
      }
    }
  `,
})
export default class AssistantComponent {
  private readonly api = inject(LearningApi);
  protected readonly site = inject(SiteService);
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly messages = signal<AssistantMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly thinking = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly suggestions = [
    'Explain the difference between a class and an object',
    'Give me a study plan for my exams',
    'How does HTTP work?',
  ];

  constructor() {
    effect(() => {
      this.messages();
      this.thinking();
      queueMicrotask(() => {
        const element = this.scroller()?.nativeElement;
        element?.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
      });
    });
  }

  protected onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.ask(this.draft());
    }
  }

  protected ask(question: string): void {
    const content = question.trim();
    if (!content || this.thinking()) return;

    const conversation: AssistantMessage[] = [...this.messages(), { role: 'user', content }];
    this.messages.set(conversation);
    this.draft.set('');
    this.error.set(null);
    this.thinking.set(true);

    this.api.askAssistant(conversation.slice(-CONTEXT_WINDOW)).subscribe({
      next: ({ reply }) => {
        this.thinking.set(false);
        this.messages.update((messages) => [...messages, { role: 'assistant', content: reply }]);
      },
      error: (err) => {
        this.thinking.set(false);
        this.error.set(errorMessage(err, 'The assistant could not answer. Please try again.'));
      },
    });
  }

  protected reset(): void {
    this.messages.set([]);
    this.error.set(null);
  }
}
