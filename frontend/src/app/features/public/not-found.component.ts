import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container empty">
        <i class="bi bi-signpost-split"></i>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <a routerLink="/" class="btn btn--primary">Back to home</a>
      </div>
    </section>
  `,
})
export default class NotFoundComponent {}
