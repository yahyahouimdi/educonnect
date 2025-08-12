import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '@core/auth.service';
import { ChatSocketService } from '@core/chat-socket.service';
import { SiteService } from '@core/site.service';
import { BrandComponent } from '@shared/brand.component';
import { InitialsPipe } from '@shared/format';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ROLE_LABELS = { ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student' } as const;

@Component({
  selector: 'app-workspace-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandComponent, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-layout.component.html',
  styleUrl: './workspace-layout.component.scss',
})
export class WorkspaceLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly site = inject(SiteService);
  private readonly chat = inject(ChatSocketService);
  protected readonly sidebarOpen = signal(false);

  protected readonly roleLabel = computed(() => {
    const role = this.auth.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly sections = computed<NavSection[]>(() => {
    const learning: NavItem[] = [
      { path: '/app', label: 'My learning', icon: 'bi-mortarboard', exact: true },
      { path: '/app/resources', label: 'Resources', icon: 'bi-folder2-open' },
      { path: '/app/chat', label: 'Chat', icon: 'bi-chat-dots' },
    ];
    if (this.site.info().features.assistant) {
      learning.push({ path: '/app/assistant', label: 'AI assistant', icon: 'bi-stars' });
    }
    const sections: NavSection[] = [{ title: 'Learning', items: learning }];

    if (this.auth.isStaff()) {
      const admin: NavItem[] = [
        { path: '/admin', label: 'Overview', icon: 'bi-speedometer2', exact: true },
        { path: '/admin/courses', label: 'Courses', icon: 'bi-journal-bookmark' },
        { path: '/admin/resources', label: 'Resources', icon: 'bi-cloud-arrow-up' },
      ];
      if (this.auth.isAdmin()) {
        admin.push(
          { path: '/admin/users', label: 'Users', icon: 'bi-people' },
          { path: '/admin/news', label: 'News', icon: 'bi-megaphone' },
          { path: '/admin/messages', label: 'Messages', icon: 'bi-inbox' },
          { path: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
        );
      }
      sections.push({ title: 'Administration', items: admin });
    }
    return sections;
  });

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.sidebarOpen.set(false));
  }

  protected logout(): void {
    this.chat.disconnect();
    this.auth.logout();
  }
}
