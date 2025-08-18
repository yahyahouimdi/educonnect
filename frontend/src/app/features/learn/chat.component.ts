import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LearningApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { ChatSocketService } from '@core/chat-socket.service';
import { ChatMessage, ChatRoom } from '@core/models';
import { NotificationService } from '@core/notification.service';
import { InitialsPipe } from '@shared/format';

@Component({
  selector: 'app-chat',
  imports: [DatePipe, FormsModule, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export default class ChatComponent {
  private readonly api = inject(LearningApi);
  private readonly notifications = inject(NotificationService);
  protected readonly socket = inject(ChatSocketService);
  protected readonly auth = inject(AuthService);

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private liveSubscription?: Subscription;

  protected readonly rooms = signal<ChatRoom[]>([]);
  protected readonly activeRoom = signal<ChatRoom | null>(null);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly loadingHistory = signal(false);
  protected readonly draft = signal('');
  protected readonly roomsOpen = signal(false);

  protected readonly canSend = computed(() => this.draft().trim().length > 0 && this.socket.state() === 'connected');

  constructor() {
    this.socket.connect();
    this.api.chatRooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        if (rooms.length) this.open(rooms[0]);
      },
      error: (error) => this.notifications.error(error),
    });

    // Keep the newest message in view.
    effect(() => {
      this.messages();
      queueMicrotask(() => {
        const element = this.scroller()?.nativeElement;
        element?.scrollTo({ top: element.scrollHeight });
      });
    });

    inject(DestroyRef).onDestroy(() => this.liveSubscription?.unsubscribe());
  }

  protected open(room: ChatRoom): void {
    if (this.activeRoom()?.id === room.id) {
      this.roomsOpen.set(false);
      return;
    }
    this.activeRoom.set(room);
    this.roomsOpen.set(false);
    this.messages.set([]);
    this.loadingHistory.set(true);

    this.liveSubscription?.unsubscribe();
    this.liveSubscription = this.socket.messages(room.id).subscribe((message) => {
      this.messages.update((messages) =>
        messages.some((m) => m.id === message.id) ? messages : [...messages, message],
      );
    });

    this.api.chatHistory(room.id).subscribe({
      next: (history) => {
        this.loadingHistory.set(false);
        // Merge in case live messages arrived while the history was loading.
        this.messages.update((live) => [...history, ...live.filter((m) => !history.some((h) => h.id === m.id))]);
      },
      error: (error) => {
        this.loadingHistory.set(false);
        this.notifications.error(error);
      },
    });
  }

  protected send(): void {
    const room = this.activeRoom();
    const content = this.draft().trim();
    if (!room || !content) return;
    if (this.socket.send(room.id, content)) {
      this.draft.set('');
    } else {
      this.notifications.error(null, 'You are offline. Reconnecting…');
    }
  }

  protected isMine(message: ChatMessage): boolean {
    return message.senderId === this.auth.user()?.id;
  }

  /** Whether to show the sender header (first message of a run from the same person). */
  protected startsGroup(index: number): boolean {
    const messages = this.messages();
    return index === 0 || messages[index - 1].senderId !== messages[index].senderId;
  }
}
