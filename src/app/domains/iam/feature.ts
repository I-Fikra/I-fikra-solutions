import type { Routes } from '@angular/router';

export const AUTH_FEATURE_ID = 'auth';

/**
 * Lazy-loads the auth routes chunk.
 *
 * Used by app.routes.ts via loadChildren — returns the default export
 * which Angular's router resolves automatically (no `.then()` needed
 * when using default exports).
 *
 * @example
 * // In app.routes.ts:
 * { path: 'auth', loadChildren: loadAuthFeatureRoutes }
 */
export function loadAuthFeatureRoutes(): Promise<{ default: Routes }> {
  return import('@/app/services/auth/auth.routes');
}
