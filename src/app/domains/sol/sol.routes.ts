import { Routes } from '@angular/router';

const solRoutes: Routes = [
  {
    path: 'app-config',
    loadComponent: () =>
      import('@/app/domains/sol/configuration/presentation/configuration/app-configuration.component').then(
        (m) => m.AppConfigurationComponent
      ),
    data: { titleKey: 'menu.configuration' }
  },
  {
    path: 'platforms/:id',
    loadComponent: () =>
      import('./platforms/presentation/platforms/platforms').then(
        (m) => m.Platforms
      ),
    data: { titleKey: 'menu.platforms' }
  }
];

export default solRoutes;
