import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AdminApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { DashboardStats } from '@core/models';
import { SiteService } from '@core/site.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Overview</h1>
        <p>{{ site.info().name }} at a glance.</p>
      </div>
      <div class="row">
        <a routerLink="/admin/courses" class="btn btn--primary"><i class="bi bi-plus-lg"></i> New course</a>
        @if (auth.isAdmin()) {
          <a routerLink="/admin/news/new" class="btn"><i class="bi bi-megaphone"></i> Publish news</a>
        }
      </div>
    </div>

    @if (stats(); as stats) {
      <div class="grid grid--4">
        @for (card of cards(stats); track card.label) {
          <a class="card card--hover" [routerLink]="card.link">
            <div class="card__body stat">
              <span class="stat__icon"><i [class]="'bi ' + card.icon"></i></span>
              <div>
                <div class="stat__value">{{ card.value }}</div>
                <div class="stat__label">{{ card.label }}</div>
              </div>
            </div>
          </a>
        }
      </div>

      @if (auth.isAdmin() && stats.unreadMessages > 0) {
        <a routerLink="/admin/messages" class="alert mt-3">
          <i class="bi bi-inbox"></i>
          You have {{ stats.unreadMessages }} unread contact {{ stats.unreadMessages === 1 ? 'message' : 'messages' }}.
        </a>
      }
    } @else {
      <div class="loading"><span class="spinner"></span></div>
    }

    <h2 class="section-title">Getting started</h2>
    <div class="grid grid--3">
      @for (step of steps(); track step.title) {
        <a class="card card--hover" [routerLink]="step.link">
          <div class="card__body">
            <span class="stat__icon"><i [class]="'bi ' + step.icon"></i></span>
            <h3 class="mt-2">{{ step.title }}</h3>
            <p class="text-muted mb-0">{{ step.text }}</p>
          </div>
        </a>
      }
    </div>
  `,
  styles: `
    .section-title {
      font-size: 1.2rem;
      margin: 36px 0 16px;
    }
  `,
})
export default class AdminDashboardComponent {
  protected readonly auth = inject(AuthService);
  protected readonly site = inject(SiteService);
  protected readonly stats = toSignal(
    inject(AdminApi)
      .dashboard()
      .pipe(catchError(() => of(null))),
  );

  protected cards(stats: DashboardStats) {
    const usersLink = this.auth.isAdmin() ? '/admin/users' : '/admin';
    return [
      { label: 'Students', value: stats.students, icon: 'bi-mortarboard', link: usersLink },
      { label: 'Teachers', value: stats.teachers, icon: 'bi-person-workspace', link: usersLink },
      {
        label: `Courses (${stats.publishedCourses} published)`,
        value: stats.courses,
        icon: 'bi-journal-bookmark',
        link: '/admin/courses',
      },
      { label: 'Resources', value: stats.resources, icon: 'bi-folder2-open', link: '/admin/resources' },
    ];
  }

  protected steps() {
    const steps = [
      {
        icon: 'bi-journal-plus',
        title: 'Create a course',
        text: 'Add chapters written in Markdown and exercises to check understanding.',
        link: '/admin/courses',
      },
      {
        icon: 'bi-cloud-arrow-up',
        title: 'Share resources',
        text: 'Upload lecture notes, exercise sheets and other documents for students.',
        link: '/admin/resources',
      },
    ];
    if (this.auth.isAdmin()) {
      steps.unshift({
        icon: 'bi-palette',
        title: 'Brand your website',
        text: 'Set your institution name, logo, colors and contact details.',
        link: '/admin/settings',
      });
    }
    return steps;
  }
}
