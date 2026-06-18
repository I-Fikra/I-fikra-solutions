# Sakai Angular — application architecture

This document describes the **clean, scalable folder layout** applied to the Sakai template (Angular 21, standalone components). It is intended for onboarding and for discussions with tech leads.

---

## 1. What we set out to do

| Phase | Goal |
|--------|------|
| **Analysis** | Map Sakai’s folders to **core**, **shared**, **features**, and **layout** (Matero-style mental model). |
| **Core / shared** | Introduce **core** (root providers, cross-cutting models) and **shared** (reusable Angular module exports + demo services). |
| **Features** | Move all routed “pages” under **`features/`** and lazy-load them with small route entry files. |
| **Routing** | Keep **public URLs unchanged** where possible; split `/pages/*` into **per-route lazy chunks**; add a **`@features/*`** TypeScript path alias. |

**Non-goals (by design):** No visual redesign, no HTML/CSS theme changes, and no change to PrimeNG usage patterns beyond moving files and imports.

---

## 1b. Feature module standard (e.g. Alexandria Port / enterprise)

Every folder under **`src/app/features/<feature-name>/`** follows this contract:

| Folder | Purpose |
|--------|---------|
| **`pages/`** | **Routable smart components** only — one `*.component.ts` per route target (e.g. `crud.component.ts` → `CrudComponent`). |
| **`components/`** | **Dumb / presentational** pieces used **inside** that feature (e.g. dashboard widgets, landing sections). |
| **`services/`** | Optional — feature-scoped APIs/state when the feature grows. |
| **`models/`** | Optional — feature-scoped interfaces/types when the feature grows. |
| **`*.routes.ts`** | Stays at the **feature root** (e.g. `auth.routes.ts`, `uikit.routes.ts`). Lazy `import()` paths in `src/app.routes.ts` stay **unchanged** when you only move files inside a feature. |

**Naming:** Files use **kebab-case** + **`.component.ts`**. Classes use **`PascalCase` + `Component`** (or `WidgetComponent` for widgets). The auth error page uses **`AuthErrorComponent`** to avoid clashing with the global `Error` type.

**Single-page features** (empty, notfound): use **`pages/`** only; no empty `components/` folder.

**Multi-route without shared dumb UI** (uikit): all demos live under **`uikit/pages/*.component.ts`**; **`uikit.routes.ts`** imports from `./pages/...`.

---

## 2. Final folder structure (`src/app`)

```
src/app/
├── core/                          # App-wide infrastructure (import once from bootstrap)
│   ├── core.providers.ts          # Spread into app.config providers (interceptors, etc.)
│   ├── index.ts
│   └── models/
│       ├── layout.model.ts        # LayoutConfig (shared type for layout shell)
│       └── index.ts
│
├── shared/                        # Reusable building blocks (no feature-specific business)
│   ├── shared.module.ts           # Re-exports CommonModule, Forms, ReactiveForms, RouterModule
│   ├── index.ts
│   └── services/                  # Demo/mock data services used by several features
│       ├── country.service.ts
│       ├── customer.service.ts
│       ├── icon.service.ts
│       ├── node.service.ts
│       ├── photo.service.ts
│       └── product.service.ts
│
├── layout/                        # Application shell (chrome only)
│   ├── service/
│   │   └── layout.service.ts      # Menu mode, dark mode, overlay state (providedIn: 'root')
│   └── component/
│       ├── app.layout.ts
│       ├── app.topbar.ts
│       ├── app.sidebar.ts
│       ├── app.menu.ts
│       ├── app.menuitem.ts
│       ├── app.footer.ts
│       ├── app.configurator.ts
│       └── app.floatingconfigurator.ts
│
└── features/                      # One folder per product area / demo route group
    ├── auth/
    │   ├── auth.routes.ts
    │   └── pages/                   # login.component.ts, auth-error.component.ts, access.component.ts
    ├── crud/
    │   ├── crud.routes.ts
    │   └── pages/crud.component.ts
    ├── dashboard/
    │   ├── dashboard.routes.ts
    │   ├── pages/dashboard.component.ts
    │   └── components/              # *-widget.component.ts
    ├── documentation/
    │   ├── documentation.routes.ts
    │   ├── pages-documentation.routes.ts
    │   └── pages/documentation.component.ts
    ├── empty/
    │   ├── empty.routes.ts
    │   └── pages/empty.component.ts
    ├── landing/
    │   ├── landing.routes.ts
    │   ├── pages/landing.component.ts
    │   └── components/              # *-widget.component.ts
    ├── notfound/
    │   ├── notfound.routes.ts
    │   └── pages/not-found.component.ts
    └── uikit/
        ├── uikit.routes.ts
        └── pages/                   # *-demo.component.ts (PrimeNG demos)
```

**Bootstrap files (outside `src/app/`):**

- `src/app.routes.ts` — root `Routes` and all `loadChildren` targets.
- `src/app.config.ts` — includes `...coreProviders` alongside router, HTTP, PrimeNG.

---

## 3. Step-by-step summary of changes

### Step 1 — Analysis

- Described how **core** vs **shared** vs **features** vs **layout** should be used in this codebase.
- Identified that Sakai’s `pages/` folder was really a mix of **features** and **demo services**.

### Step 2 — Core and shared

- Added **`core/`** with:
  - **`coreProviders`** — empty array today; use for `HTTP_INTERCEPTORS`, `APP_INITIALIZER`, global error handlers.
  - **`LayoutConfig`** model moved out of `layout.service.ts` into **`core/models/layout.model.ts`** so layout code depends on a clear shared type.
- Added **`shared/SharedModule`** — re-exports common Angular modules for optional use in standalone components or future NgModule boundaries.
- Updated **`app.config.ts`** to spread **`coreProviders`**.
- **Did not** move `LayoutService` into core — it is **shell-specific** and stays under **`layout/service/`**.

### Step 3 — Feature modules

- Renamed **`src/app/pages` → `src/app/features`** (all feature components and route files).
- Moved demo data services from **`pages/service`** to **`shared/services/`** and updated imports to `@/app/foundation/shared/services/...`.
- Introduced **per-feature `*.routes.ts`** files with **`export default [ ... ] as Routes`** for lazy loading (dashboard, documentation, landing, notfound, plus existing uikit/auth).
- Fixed landing footer navigation to use **`/landing`** (matches real routes).
- Updated in-app documentation copy to reference **`src/app/features`** instead of `src/app/pages`.

### Step 4 — Routing and lazy loading

- **`AppLayout` children** use **`loadChildren`** for dashboard, uikit, documentation, and each **`pages/*`** segment.
- Replaced a single lazy **`pages.routes.ts`** bundle with a **`path: 'pages'`** parent that has **child routes**, each with its own **`loadChildren`** (crud, empty, pages-documentation).
- Preserved URLs such as **`/pages/crud`**, **`/pages/empty`**, **`/pages/documentation`**.
- Added **`@features/*` → `src/app/features/*`** in **`tsconfig.json`** for cleaner static imports (dynamic `import()` in routes stays relative for stable chunk names).

---

## 4. Routing map (high level)

| URL area | Lazy entry |
|----------|------------|
| `/` (inside shell) | `features/dashboard/dashboard.routes.ts` |
| `/uikit/*` | `features/uikit/uikit.routes.ts` |
| `/documentation` | `features/documentation/documentation.routes.ts` |
| `/pages/documentation` | `features/documentation/pages-documentation.routes.ts` |
| `/pages/crud` | `features/crud/crud.routes.ts` |
| `/pages/empty` | `features/empty/empty.routes.ts` |
| `/landing` | `features/landing/landing.routes.ts` |
| `/notfound` | `features/notfound/notfound.routes.ts` |
| `/auth/*` | `features/auth/auth.routes.ts` |

Exact path `**/pages**` with no child redirects to **`/notfound`** (same spirit as the old catch-all under the pages bundle).

---

## 5. Architecture in one slide (for a team lead)

- **Layout** = the frame users always see (nav, theme, menu). It owns **layout state** (`LayoutService`).
- **Features** = everything that answers a **route** (dashboard, CRUD demo, auth screens, UI kit demos). Each area can grow its own components, services, and `*.routes.ts` without polluting the rest of the app.
- **Core** = **one-time app wiring**: global providers and **types/models** that are not tied to a single screen. Today that is mainly **`coreProviders`** + **`LayoutConfig`**.
- **Shared** = **reusable glue**: Angular module re-exports and **cross-feature demo services** so we do not copy mock APIs into every feature folder.

We use **standalone components** and **lazy `loadChildren`** so each feature loads as its own **JavaScript chunk**, which keeps the initial bundle smaller as the app grows.

---

## 6. Conventions for future work

1. **New screen with a new URL** → add under **`features/<name>/`**, add **`<name>.routes.ts`**, register in **`src/app.routes.ts`**.
2. **New singleton (auth, logging, interceptors)** → register in **`coreProviders`** (or a dedicated `provideCore()` if you outgrow a flat array).
3. **Reusable UI (pipe, directive, dumb component)** → **`shared/`** (and export via `SharedModule` or standalone + barrel).
4. **Feature-only API or state** → keep inside that **feature folder**; avoid importing features from other features — go through **shared** or **core** if truly shared.

---

## 7. Path aliases (`tsconfig.json`)

| Alias | Target |
|--------|--------|
| `@/*` | `src/*` |
| `@features/*` | `src/app/features/*` |

Example: `import { X } from '@features/dashboard/dashboard';`  
Lazy route files should keep **relative** `import('./app/features/...')` paths in **`app.routes.ts`**.

---

*Generated as part of the Sakai → scalable architecture refactor.*
