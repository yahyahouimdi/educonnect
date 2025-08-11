import { inject, Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SiteService } from './site.service';

/** Renders route titles as "Page · Institution" using the configured institution name. */
@Injectable()
export class InstitutionTitleStrategy extends TitleStrategy {
  private readonly site = inject(SiteService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.site.setPageTitle(this.buildTitle(snapshot));
  }
}
