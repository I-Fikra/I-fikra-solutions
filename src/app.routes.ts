import { Routes } from '@angular/router';
import { guestGuard } from './app/foundation/core/guards/guest.guard';
import { authGuard } from './app/foundation/core/guards/auth.guard';
import { platformGuard } from './app/foundation/core/guards/platform.guard';
import { AppLayout } from './app/foundation/core/layout/component/app.layout';
import dashboardRoutes from './app/services/dashboard/dashboard.routes';

/**
 * Root routes.
 *
 * Architecture:
 * - /auth/**  → guest-only, no layout shell
 * - /         → authenticated shell (AppLayout) with all feature children
 * - **        → 404
 */
export const appRoutes: Routes = [
  // ─── Auth (no layout shell, guest only) ───────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./app/services/iam/iam.routes')
  },

  // ─── IAM management (inside layout shell, authenticated) ──────────────
  {
    path: 'iam',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./app/foundation/core/layout/component/app.layout').then(
        (m) => m.AppLayout
      ),
    loadChildren: () =>
      import('./app/services/iam/iam-management.routes').then((m) => m.default)
  },

  // ─── Authenticated shell ───────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    component: AppLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ── Dashboard ──────────────────────────────────────────────────
      {
        path: 'dashboard',
        children: dashboardRoutes,
        data: { preload: true, titleKey: 'menu.dashboard' }
      },

      // ── Feature modules ────────────────────────────────────────────
      {
        path: 'sol',
        canActivate: [platformGuard],
        loadChildren: () =>
          import('./app/services/sol/sol.routes').then((m) => m.default)
      },
      {
        path: 'builder',
        canActivate: [platformGuard],
        loadChildren: () =>
          import('./app/services/builder/builder.routes').then((m) => m.default)
      }
    ]
  },

  // ─── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./app/foundation/core/notfound/pages/not-found.component').then(
        (m) => m.NotFoundComponent
      )
  }
];
