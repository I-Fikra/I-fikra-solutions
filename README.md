# 🚀 Sakai Refactored Dashboard

A refactored Angular dashboard built on top of the Sakai PrimeNG template, with improved architecture inspired by NG Matero.

### 🔗 References
- **Sakai Template** — [Repo](https://github.com/primefaces/sakai-ng) | [Demo](https://sakai.primeng.org/)
- **NG Matero** — [Repo](https://github.com/ng-matero/ng-matero) | [Demo](https://ng-matero.github.io/ng-matero/dashboard)

---

### 🛠️ Tech Stack
- Angular
- PrimeNG
- TypeScript
- Tailwind and SCSS
- Transloco for localization

---

### ⚙️ Getting Started

```bash
git clone <your-repo-link>
cd <project-folder>
npm install
ng serve
```

Then open: **http://localhost:4200/**

---

# Angular Project Coding Guide — v2.4

---

## Part 1 — Shared Components Reference

> These components are **mandatory**. Never bypass them with raw PrimeNG equivalents.

---

### 1.1 `<app-table>` — `TableComponent`
[table](./docs/shared/table.md)

---

### 1.2 `<app-dialog-shell>` — `DialogShellComponent`
[dialog shell](./docs/shared/dialog-shell.md)

---

### 1.3 `<app-shared-toolbar>` — `SharedToolbarComponent`
[toolbar](./docs/shared/toolbar.md)

---

### 1.4 `<app-shared-bottom-bar>` — `SharedBottomBarComponent`
[bottom bar](./docs/shared/bottom-bar.md)

---

### 1.5 `<app-filter>` — `FilterComponent`
[filter](./docs/shared/filter.md)

---

### 1.6 Other Shared Components

| Component | File | Use when |
|---|---|---|
| `<app-popup-shell>` | `popup-shell/popup-shell.ts` | Custom overlay without dialog chrome |
| `<app-delete-confirm-popup>` | `delete-confirm-popup/...` | Per-row inline delete confirmation |
| `<app-delete-button>` | `delete-button/...` | Bulk delete or programmatic row delete |
| `<app-actions-menu>` | `actions-menu/...` | Standalone 3-dots row menu |
| `<app-tree-table>` | `tree-table/tree-table.ts` | Hierarchical data (2 or 3 levels) |

---

### 1.7 `<app-tree-table>` — `TreeTableComponent`
[tree-table](./docs/shared/tree-table.md)

---
### 1. `<app-card>` — `Card`
[card](./docs/shared/card.md)

---

## Part 1.8 — رحلة بناء الصفحة: من الـ Sidebar للكود
[building-a-page](./docs/shared/building-a-page.md)

---

## Part 2 — Module Build Journey
[Module Build Journey](./docs/module-build-journey.md)

---

## Part 2.5 — نظام الترجمة (Transloco i18n)
[transloco-i18n](./docs/transloco-i18n.md)

---

## Part 3 — Coding Rules
[coding-rules](./docs/coding-rules.md)

---

## Part 4 — ⚡ Performance
[performance](./docs/performance.md)

---

## Part 5 — API Layer & Data Handling
[api-layer-and-data-handling](./docs/api-layer-and-data-handling.md)

---

## Quick Reference

| You want to… | Use |
|---|---|
| Flat data table with toolbar, filters, pagination | `<app-table [data]="..." [columns]="...">` |
| Table + cards/grid toggle | `<app-table [showLayoutToggle]="true">` + `#cardTemplate` |
| Custom card per row in grid view | Project `<ng-template #cardTemplate let-item>` inside `<app-table>` |
| Card 3-dots menu | One shared `<p-menu #cardMenu>` + `openCardMenu()` swapping model |
| Open create/edit dialog | `<app-dialog-shell [(visible)]="..." (save)="...">` |
| Per-row action menu | `[rowActions]="myArrowFn"` on `<app-table>` |
| Bulk delete bottom bar | Built into `<app-table>` — enable with `[showBulkDelete]="true"` |
| Toolbar filter chips | `[toolbarFilters]="..."` on `<app-table>` |
| Status tag coloring | `[severityMap]="..."` on `<app-table>` or `\| severity` pipe |
| 2-level hierarchy (parent → children) | `<app-tree-table [nestedConfig]="cfg">` |
| 3-level hierarchy | `<app-tree-table>` with nested `nestedConfig` |
| Lightweight overlay / context popup | `<app-popup-shell (dismissed)="...">` |
| Per-row inline delete confirm | `<app-delete-confirm-popup>` |
| Bulk / bottom-bar delete with confirm | `<app-delete-button>` |
| Reduce unnecessary re-renders | `changeDetection: ChangeDetectionStrategy.OnPush` on every component |
| Local UI state | `signal<T>()` — not plain variables |
| Derived/computed values | `computed()` — not getters |
| Unsubscribe from Observables | `takeUntilDestroyed(destroyRef)` |
| Mock data before backend is ready | JSON file in `public/api/` + `BaseApiService` |