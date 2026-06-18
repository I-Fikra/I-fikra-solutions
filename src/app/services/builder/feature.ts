import type { Routes } from '@angular/router';

export const BUILDER_FEATURE_ID = 'builder';

/** Builder feature routes — lazy entry point referenced from domain.config.ts */
export function loadBuilderFeatureRoutes(): Promise<{ default: Routes }> {
  return import('./builder.routes');
}
