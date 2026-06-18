/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    DOMAIN CONFIGURATION                                  ║
 * ║                                                                          ║
 * ║  الـ structure الحقيقية عندنا 3 مستويات:                                 ║
 * ║                                                                          ║
 * ║  Domain  → التصنيف الأكبر (بيظهر كـ section header في الـ sidebar)      ║
 * ║    Module  → Angular feature module (org, vsl, msg…)                    ║
 * ║      Sub-module → صفحة/feature جوا الـ module (organizations, visits…)  ║
 * ║                                                                          ║
 * ║  مثال:                                                                   ║
 * ║  Domain: "identity"                                                      ║
 * ║    Module: "auth" → /users, /roles                         ║
 * ║                                                                          ║
 * ║  عشان تضيف domain جديد: أضف entry في DOMAINS                            ║
 * ║  عشان تفعّل/تعطّل module: غيّر enabled في الـ module descriptor         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ── Config Source of Truth (Phase 3) ──────────────────────────────────────────
 * THIS FILE is the single source of truth for: the admin shell's own sidebar
 * structure, section headers, module groupings, and routerLinks. `app.menu.ts`
 * builds the rendered menu from `DOMAINS` and nothing else.
 *
 * This is NOT branding (app name/logo/colors — see `ProjectConfigService`) and
 * NOT the platform-generator's domain/feature catalog (see `ConfigDataService`
 * in `services/sol/configuration/infrastructure`) — those are separate concerns
 * for separate products, not duplicates of this file. See the header comments
 * in those files for their own scope.
 *
 * One real (currently unused) touchpoint with `ProjectConfigService`: a
 * `ModuleConfig` may define `subModulesFactory(projects: ProjectConfig[])` to
 * generate its sub-items dynamically per available project. `app.menu.ts`
 * always passes `ProjectConfigService.availableProjects()` into this hook, but
 * no module currently uses it — every module today uses the static
 * `subModules` array instead.
 */

import type { Routes } from '@angular/router';
import type { ProjectConfig } from '@/app/foundation/core/models';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Sub-module = صفحة/feature جوا الـ Angular module */
export interface SubModuleConfig {
  id: string;
  label: string; // i18n key
  icon: string; // PrimeIcons class
  routerLink: string[];
  enabled: boolean;
}

/** Angular module = feature module كامل بـ routes + bundle */
export interface ModuleConfig {
  id: string;
  label: string; // i18n key  — بيظهر في الـ sidebar كـ group header
  icon: string; // PrimeIcons class
  routePath: string; // URL prefix (e.g. 'auth-mgmt', 'builder/platforms')
  loadRoutes: () => Promise<{ default: Routes }>;
  enabled: boolean;
  preload: boolean;
  subModules: SubModuleConfig[];
  subModulesFactory?: (projects: ProjectConfig[]) => SubModuleConfig[];
}

/** Domain = أكبر تصنيف — section header في الـ sidebar */
export interface DomainConfig {
  id: string;
  label: string; // i18n key — بيظهر كـ section title في الـ sidebar
  enabled: boolean;
  modules: ModuleConfig[];
}

// ── Domain Registry ───────────────────────────────────────────────────────────

export const DOMAINS: DomainConfig[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // Domain: HOME
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'home',
    label: 'menu.home',
    enabled: true,
    modules: [
      {
        id: 'dashboard',
        label: 'menu.dashboard',
        icon: 'pi pi-fw pi-home',
        routePath: 'dashboard',
        loadRoutes: () =>
          import('@/app/services/dashboard/feature').then((m) =>
            m.loadDashboardFeatureRoutes()
          ),
        enabled: true,
        preload: true,
        subModules: []
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Domain: IDENTITY  (من الـ sidebar: section "menu.identity")
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'identity',
    label: 'menu.identity',
    enabled: true,
    modules: [
      {
        id: 'auth',
        label: 'menu.iam',
        icon: 'pi pi-fw pi-user',
        routePath: 'auth-mgmt', // auth pages live inside root layout, not /auth
        loadRoutes: () => Promise.resolve({ default: [] as Routes }),
        enabled: true,
        preload: false,
        subModules: [
          {
            id: 'users',
            label: 'menu.users',
            icon: 'pi pi-fw pi-users',
            routerLink: ['/users'],
            enabled: true
          },
          {
            id: 'roles',
            label: 'menu.roles',
            icon: 'pi pi-fw pi-list-check',
            routerLink: ['/roles'],
            enabled: true
          }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Domain: BUILDER  (Platform Builder — 4 pages)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'builder',
    label: 'menu.builder',
    enabled: true,
    modules: [
      // ── Platforms — tree table of all projects ──────────────────────────
      {
        id: 'platforms',
        label: 'menu.platforms',
        icon: 'pi pi-fw pi-th-large',
        routePath: 'builder/platforms',
        loadRoutes: () =>
          import('@/app/services/builder/feature').then((m) =>
            m.loadBuilderFeatureRoutes()
          ),
        enabled: true,
        preload: false,
        subModules: []
      },
      // ── Metadata — branding wizard ──────────────────────────────────────
      {
        id: 'metadata',
        label: 'menu.metadata',
        icon: 'pi pi-fw pi-tag',
        routePath: 'builder/metadata',
        loadRoutes: () =>
          import('@/app/services/builder/feature').then((m) =>
            m.loadBuilderFeatureRoutes()
          ),
        enabled: true,
        preload: false,
        subModules: []
      },
      // ── Generator — project setup / module picker ───────────────────────
      {
        id: 'generator',
        label: 'menu.generator',
        icon: 'pi pi-fw pi-box',
        routePath: 'builder/generator',
        loadRoutes: () =>
          import('@/app/services/builder/feature').then((m) =>
            m.loadBuilderFeatureRoutes()
          ),
        enabled: true,
        preload: false,
        subModules: []
      },
      // ── Configuration — theme, appearance, personality ──────────────────
      {
        id: 'configuration',
        label: 'menu.configuration',
        icon: 'pi pi-fw pi-sliders-h',
        routePath: 'builder/configuration',
        loadRoutes: () =>
          import('@/app/services/builder/feature').then((m) =>
            m.loadBuilderFeatureRoutes()
          ),
        enabled: true,
        preload: false,
        subModules: []
      }
    ]
  }
];





// ── Helpers ───────────────────────────────────────────────────────────────────

/** كل الـ modules المفعّلة في ترتيب مسطّح — بتستخدمها app.routes.ts */
export function getEnabledModules(): ModuleConfig[] {
  return DOMAINS.filter((d) => d.enabled)
    .flatMap((d) => d.modules)
    .filter((m) => m.enabled);
}

/** Auth management pages — بتعيش جوا الـ AppLayout مش جوا /auth */
export const AUTH_MANAGEMENT_PAGES = [
  {
    path: 'users',
    loadComponent: () =>
      import('@/app/services/iam/authorization/users/presentation/pages/users/users').then(
        (m) => m.UsersPage
      )
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('@/app/services/iam/authorization/roles/pages/roles').then(
        (m) => m.RolesPage
      )
  },
  {
    path: 'roles/:id/permissions',
    loadComponent: () =>
      import('@/app/services/iam/authorization/role-details/pages/role-details').then(
        (m) => m.RoleDetailsComponent
      )
  }
] as const;
