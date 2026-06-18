import type { Routes } from '@angular/router';

export const SOL_FEATURE_ID = 'sol';

/** Org feature routes (migrated under `src/app/features/org`). */
export function loadSolFeatureRoutes(): Promise<{ default: Routes }> {
  return import('./sol.routes');
}
