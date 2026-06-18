import { Routes } from '@angular/router';

/**
 * IAM management routes — mounted at /iam via app.routes.ts
 * All pages run inside the AppLayout shell.
 */
const iamRoutes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },

  {
    path: 'users',
    loadComponent: () =>
      import('./authorization/users/presentation/pages/users/users').then(
        (m) => m.UsersPage
      ),
    data: { titleKey: 'menu.users' }
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./authorization/roles/pages/roles').then((m) => m.RolesPage),
    data: { titleKey: 'menu.roles' }
  },
  {
    path: 'roles/:id',
    loadComponent: () =>
      import('./authorization/role-details/pages/role-details').then(
        (m) => m.RoleDetailsComponent
      ),
    data: { titleKey: 'menu.roles' }
  }
];

export default iamRoutes;
