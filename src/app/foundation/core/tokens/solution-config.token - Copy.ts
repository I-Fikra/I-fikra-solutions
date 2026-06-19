import { InjectionToken } from '@angular/core';
import type { SolutionConfig } from '@/app/foundation/core/models/solution-config.model';

/**
 * SOLUTION_CONFIG — injection token for the currently active SolutionConfig.
 *
 * Provided once at the root level in `app.config.ts` using
 * `buildSolutionConfigFromDomains()` (Phase 5), so the active solution is
 * available via `inject(SOLUTION_CONFIG)` anywhere in the app.
 *
 * Phase 6: resolves to the single default solution built from DOMAINS.
 * Future phases: can be swapped for a dynamic value (e.g. loaded from API)
 * without changing any consumer — they all just inject this token.
 */
export const SOLUTION_CONFIG = new InjectionToken<SolutionConfig>('SOLUTION_CONFIG');
