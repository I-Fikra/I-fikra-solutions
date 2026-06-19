import { Routes } from '@angular/router';
import { guestGuard } from '@/app/foundation/core/guards/guest.guard';

/**
 * Auth routes — mounted at /auth via app.routes.ts
 * Only registration-flow pages live here (no layout shell).
 */
const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./authentication/login/presentation/pages/login/login.page').then(
        (m) => m.LoginPage
      ),
    data: { titleKey: 'menu.login' }
  },
  {
    path: 'forget-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./authentication/forget-password/pages/forget-password').then(
        (m) => m.ForgetPassword
      ),
    data: { titleKey: 'menu.forgetPassword' }
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./authentication/reset-password/pages/reset-password').then(
        (m) => m.ResetPassword
      ),
    data: { titleKey: 'menu.resetPassword' }
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./access.component').then((m) => m.AccessComponent),
    data: { titleKey: 'menu.accessDenied' }
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./auth-error.component').then((m) => m.AuthErrorComponent),
    data: { titleKey: 'menu.error' }
  }
];

export default authRoutes;
