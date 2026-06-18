import { Routes } from '@angular/router';

const builderRoutes: Routes = [
  // ── Default redirect ──────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'platforms',
    pathMatch: 'full'
  },

  // ── Platforms — tree table of all projects (SIMW, LadyDriver, I-Fikra…) ──
  {
    path: 'platforms',
    loadComponent: () =>
      import('./platforms/pages/builder-platforms').then(
        (m) => m.BuilderPlatformsPage
      ),
    data: { titleKey: 'menu.platforms' }
  },

  // ── Metadata — branding wizard (app name, logo, SEO, social, PWA) ─────────
  {
    path: 'metadata',
    loadComponent: () =>
      import('@/app/services/builder/metadata/presentation/pages/metadata/metadata').then(
        (m) => m.Metadata
      ),
    data: { titleKey: 'menu.metadata' }
  },

  // ── Generator — project setup / module picker ─────────────────────────────
  {
    path: 'generator',
    loadComponent: () =>
      import('@/app/services/sol/configuration/presentation/domains/domains').then(
        (m) => m.Domains
      ),
    data: { titleKey: 'menu.generator' }
  },

  // ── Configuration — full AppConfigurationComponent (all 3 sections) ───────
  {
    path: 'configuration',
    loadComponent: () =>
      import('@/app/services/sol/configuration/presentation/configuration/app-configuration.component').then(
        (m) => m.AppConfigurationComponent
      ),
    data: { titleKey: 'menu.configuration' }
  }
];

export default builderRoutes;
