import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatMessage } from './models';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface RoomChannel {
  subject: Subject<ChatMessage>;
  listeners: number;
  subscription?: StompSubscription;
}

/** Real-time chat over STOMP/WebSocket, authenticated with the user's access token. */
@Injectable({ providedIn: 'root' })
export class ChatSocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly rooms = new Map<string, RoomChannel>();
  private client?: Client;

  readonly state = signal<ConnectionState>('disconnected');

  connect(): void {
    if (this.client?.active) {
      return;
    }
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: `${protocol}://${location.host}/ws`,
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      beforeConnect: async (client) => {
        this.state.set('connecting');
        client.connectHeaders = { Authorization: `Bearer ${this.auth.token ?? ''}` };
      },
      onConnect: () => {
        this.state.set('connected');
        // Subscriptions do not survive a reconnection, so restore them.
        this.rooms.forEach((channel, room) => this.subscribe(room, channel));
      },
      onWebSocketClose: () => this.state.set('disconnected'),
      onStompError: () => this.state.set('disconnected'),
    });
    this.client.activate();
  }

  /** Emits every message published to the room while subscribed. */
  messages(room: string): Observable<ChatMessage> {
    return new Observable<ChatMessage>((subscriber) => {
      let channel = this.rooms.get(room);
      if (!channel) {
        channel = { subject: new Subject<ChatMessage>(), listeners: 0 };
        this.rooms.set(room, channel);
        if (this.client?.connected) {
          this.subscribe(room, channel);
        }
      }
      channel.listeners++;
      const inner = channel.subject.subscribe(subscriber);

      return () => {
        inner.unsubscribe();
        channel.listeners--;
        if (channel.listeners === 0) {
          this.rooms.delete(room);
          this.safeUnsubscribe(channel.subscription);
        }
      };
    });
  }

  send(room: string, content: string): boolean {
    if (!this.client?.connected) {
      return false;
    }
    this.client.publish({ destination: `/app/chat/${room}`, body: JSON.stringify({ content }) });
    return true;
  }

  disconnect(): void {
    void this.client?.deactivate();
    this.client = undefined;
    this.state.set('disconnected');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private subscribe(room: string, channel: RoomChannel): void {
    channel.subscription = this.client?.subscribe(`/topic/rooms/${room}`, (frame) =>
      channel.subject.next(JSON.parse(frame.body) as ChatMessage),
    );
  }

  private safeUnsubscribe(subscription?: StompSubscription): void {
    try {
      subscription?.unsubscribe();
    } catch {
      // The connection may already be closed.
    }
  }
}
