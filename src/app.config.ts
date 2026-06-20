import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { provideTransloco } from '@jsverse/transloco';
import { appRoutes } from './app.routes';
import { SelectivePreloadingStrategy } from './app/foundation/core/strategies/selective-preloading.strategy';
import { UserRepository } from './app/domains/iam/authorization/users/domain/repositories/user.repository';
import { UserRepositoryImpl } from './app/domains/iam/authorization/users/infrastructure/repositories/user.repository.impl';
import { authInterceptor } from './app/foundation/core/interceptors/auth.interceptor';
import { cacheInterceptor } from './app/foundation/core/interceptors/cache.interceptor';
import { errorInterceptor } from './app/foundation/core/interceptors/error.interceptor';
import { TranslocoHttpLoader } from './app/foundation/core/transloco/transloco-loader';
import { ProjectConfigService } from './app/foundation/core/services/project-config.service';
import { SOLUTION_CONFIG } from './app/foundation/core/tokens/solution-config.token';
import { DOMAINS } from './app/config/domain.config';
import { buildSolutionConfigFromDomains } from './app/config/domain-to-solution';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideAppInitializer(() => {
      const svc = inject(ProjectConfigService);
      return svc.load();
    }),

    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      withPreloading(SelectivePreloadingStrategy),
      withViewTransitions(),
      withHashLocation()
    ),

    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, cacheInterceptor, errorInterceptor])
    ),

    provideAnimationsAsync(),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.app-dark' }
      },
      ripple: true
    }),

    provideTransloco({
      config: {
        availableLangs: ['en', 'ar'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false
        // ✅ missingHandler مهم — بيطبع warning بدل ما يسيب الـ key زي ما هي
        // missingHandler: { logMissingKey: true }
      },
      loader: TranslocoHttpLoader
    }),

    SelectivePreloadingStrategy,

    { provide: UserRepository, useClass: UserRepositoryImpl },

    {
      provide: SOLUTION_CONFIG,
      useFactory: (configSvc: ProjectConfigService) =>
        buildSolutionConfigFromDomains(
          DOMAINS,
          configSvc.projectName(),
          configSvc.availableProjects()
        ),
      deps: [ProjectConfigService]
    }
  ]
};
