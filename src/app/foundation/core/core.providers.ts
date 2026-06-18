import { APP_INITIALIZER, inject, Provider } from '@angular/core';
import { SettingsService } from '@/app/foundation/core/settings/settings.service';

/**
 * Root-level providers: HTTP interceptors, APP_INITIALIZER, global error handlers, etc.
 * Layout shell services stay under `layout/`; feature data services stay under each feature.
 */
function initializeSettings(): void {
  // Eagerly instantiate SettingsService during bootstrap so persisted
  // language/theme preferences are applied before the app renders.
  inject(SettingsService);
}

export const coreProviders: Provider[] = [
  {
    provide: APP_INITIALIZER,
    multi: true,
    useValue: initializeSettings
  }
];
