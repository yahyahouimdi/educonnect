import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PublicApi } from '@core/api.service';
import { AuthService } from '@core/auth.service';
import { SiteService } from '@core/site.service';
import { CourseCardComponent } from './course-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, CourseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export default class HomeComponent {
  private readonly api = inject(PublicApi);
  protected readonly site = inject(SiteService);
  protected readonly auth = inject(AuthService);

  protected readonly stats = toSignal(this.api.stats().pipe(catchError(() => of(null))));
  protected readonly courses = toSignal(
    this.api.courses().pipe(
      map((courses) => courses.slice(0, 3)),
      catchError(() => of([])),
    ),
  );
  protected readonly news = toSignal(
    this.api.news(0, 3).pipe(
      map((page) => page.content),
      catchError(() => of([])),
    ),
  );

  protected readonly highlights = [
    {
      icon: 'bi-journal-richtext',
      title: 'Interactive courses',
      text: 'Structured chapters with exercises that give instant feedback and track your progress.',
    },
    {
      icon: 'bi-folder2-open',
      title: 'Course material',
      text: 'Lecture notes, exercise sheets and documents shared by teachers, always one click away.',
    },
    {
      icon: 'bi-chat-dots',
      title: 'Campus chat',
      text: 'Real-time discussion rooms for the whole institution and for every course.',
    },
    {
      icon: 'bi-stars',
      title: 'AI teaching assistant',
      text: 'Ask questions at any time and get clear explanations to help you understand.',
    },
  ];
}
