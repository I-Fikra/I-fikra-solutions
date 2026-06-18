import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { combineLatest, filter, map, of, switchMap } from 'rxjs';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly t = inject(TranslocoService);
  private readonly projectConfig = inject(ProjectConfigService);

  init(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map(() => this.getDeepestTitleKey(this.route)),
        switchMap((titleKey) =>
          combineLatest([
            titleKey ? this.t.selectTranslate(titleKey) : of(''),
            of(this.projectConfig.projectName())
          ]).pipe(
            map(([pageLabel, appName]) =>
              pageLabel ? `${pageLabel} — ${appName}` : appName
            )
          )
        )
      )
      .subscribe((title) => this.title.setTitle(title));
  }

  private getDeepestTitleKey(route: ActivatedRoute): string {
    let current = route;
    while (current.firstChild) current = current.firstChild;
    return current.snapshot.data['titleKey'] ?? '';
  }
}
