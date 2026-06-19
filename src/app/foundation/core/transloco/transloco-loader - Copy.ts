import { inject, Injectable, Injector } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { SOLUTION_CONFIG } from '@/app/foundation/core/tokens/solution-config.token';
import type { SolutionConfig } from '@/app/foundation/core/models/solution-config.model';

const KNOWN_LANGS = ['en', 'ar'];

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  // Lazily resolved to break the circular dependency:
  //   ProjectConfigService → LayoutService → TranslocoService
  //   → TranslocoHttpLoader → SOLUTION_CONFIG → ProjectConfigService
  // By deferring the inject() call to the first getTranslation() invocation
  // (after all providers are fully constructed), Angular's DI can resolve
  // the graph without hitting the cycle at startup.
  private readonly injector = inject(Injector);
  private get solution(): SolutionConfig {
    return this.injector.get(SOLUTION_CONFIG);
  }

  /**
   * Loads the base translation file, then attempts to load a solution-specific
   * override file from `public/i18n/solutions/{solutionKey}/{lang}.json`.
   *
   * If the override file doesn't exist (404), it is silently skipped — the
   * base translation is returned unchanged. When it does exist, its keys are
   * shallow-merged on top of the base (solution keys win on conflict).
   *
   * Phase 9: the placeholder files for 'default' are empty `{}`, so no visible
   * translation change occurs today. Future solutions can drop a file at the
   * right path to override any key without touching the base files.
   */
  getTranslation(langOrScope: string): Observable<Translation> {
    const normalizedPath = this.normalizePath(langOrScope);

    return this.http
      .get<Translation>(`/i18n/${normalizedPath}.json`)
      .pipe(
        catchError((err) => {
          console.warn(`⚠️ Missing i18n file: /i18n/${normalizedPath}.json`, err.status);
          return of({});
        }),
        switchMap((base) => this.mergeWithSolutionOverride(base, normalizedPath))
      );
  }

  /**
   * Attempts to load the solution-scoped override file and merge it over the
   * base translation. Returns the base unchanged if the override doesn't exist.
   *
   * Override path: /i18n/solutions/{solutionKey}/{lang}.json
   * Only applies to top-level lang files (e.g. "en", "ar") — not scoped
   * feature files (e.g. "en/roles") since those are feature-owned.
   */
  private mergeWithSolutionOverride(
    base: Translation,
    normalizedPath: string
  ): Observable<Translation> {
    // Only merge overrides for root lang files, not feature scopes like "en/roles"
    const isRootLang = !normalizedPath.includes('/');
    if (!isRootLang) {
      return of(base);
    }

    const lang = normalizedPath; // e.g. "en" or "ar"
    const solutionKey = this.solution.key; // e.g. "default"
    const overridePath = `/i18n/solutions/${solutionKey}/${lang}.json`;

    return this.http.get<Translation>(overridePath).pipe(
      catchError(() => {
        // Silently skip — file may not exist for this solution/lang combination
        return of({});
      }),
      switchMap((override) => {
        const hasOverrides = Object.keys(override).length > 0;
        if (hasOverrides) {
          console.log(
            `[i18n] Applying solution override: ${overridePath} ` +
            `(${Object.keys(override).length} key(s))`
          );
        }
        // Solution keys win on conflict — base keys are never deleted
        return of({ ...base, ...override });
      })
    );
  }

  /**
   * Ensures the path is always: lang/scope
   * even if Transloco sends it as: scope/lang
   */
  private normalizePath(langOrScope: string): string {
    if (!langOrScope.includes('/')) {
      return langOrScope;
    }

    const [first, second] = langOrScope.split('/');

    if (KNOWN_LANGS.includes(first)) {
      return langOrScope; // en/users → en/users ✅
    }

    if (KNOWN_LANGS.includes(second)) {
      return `${second}/${first}`; // users/ar → ar/users ✅
    }

    return langOrScope;
  }
}