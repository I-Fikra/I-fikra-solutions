import type { Routes } from '@angular/router';

export const DASHBOARD_FEATURE_ID = 'dashboard';

/** Lazy-loads legacy dashboard routes under `src/app/services/dashboard`. */
export function loadDashboardFeatureRoutes(): Promise<{ default: Routes }> {
  return import('@/app/domains/dashboard/dashboard.routes');
}
