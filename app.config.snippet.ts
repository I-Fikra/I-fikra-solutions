/**
 * ── app.config.ts snippet (Demo App) ─────────────────────────────────────────
 * هنا بس الجزء اللي لازم تضيفه/تعدّله في app.config.ts بتاع الديمو.
 * مش ملف كامل — snippet جاهز للدمج.
 *
 * PATH في الديمو: src/app.config.ts
 */

import { provideAppInitializer, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { resolveActiveProject } from './app/foundation/core/utils/active-project.util';
import { ProjectConfigService } from './app/foundation/core/services/project-config.service';
// ↑ هنا ProjectConfigService هو service الديمو اللي فيه applyInputConfig()
//   مش نفس الـ service في الويزارد

// أضف ده جوه providers[] في appConfig بتاع الديمو:
export const demoInitializerProvider = provideAppInitializer(async () => {
  const projectConfigService = inject(ProjectConfigService);
  const http = inject(HttpClient);

  const result = resolveActiveProject();

  if (result.source === 'url-param' && result.config) {
    // ── الحالة الرئيسية دلوقتي: كونفيج كامل في الـ URL ──────────────────
    projectConfigService.applyInputConfig(result.config);

  } else if (result.source === 'project-id' && result.projectId) {
    // ── Publish flow (خطوات 13-16 — لسه مش مبني) ──────────────────────
    // TODO: بعد ما يتبني الـ backend endpoint
    try {
      const config = await firstValueFrom(
        http.get<import('./app/foundation/core/models/project-config.generated').ProjectConfigInput>(
          `/api/configs/${result.projectId}`
        )
      );
      projectConfigService.applyInputConfig(config);
    } catch (e) {
      console.error('[DemoInit] فشل جلب الكونفيج من الـ backend:', e);
      // شغّل الـ default بدون crash
    }

  } else {
    // ── مفيش config — شغّل الـ default ──────────────────────────────────
    // projectConfigService هيشتغل بالقيم الـ default بتاعته
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// في app.config.ts بتاع الديمو:
// ─────────────────────────────────────────────────────────────────────────────
//
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZonelessChangeDetection(),
//     demoInitializerProvider,   // ← ضيف السطر ده
//     provideRouter(appRoutes, withHashLocation(), ...),
//     provideHttpClient(withFetch()),
//     // ... باقي الـ providers
//   ]
// };
