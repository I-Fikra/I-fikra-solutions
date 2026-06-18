## Coding Rules
### 3.1 TypeScript

**DI — `inject()` only, no constructor injection:**
```typescript
// ✅ DO
private t   = inject(TranslocoService);
private svc = inject(RoleService);

// ❌ DON'T
constructor(private svc: RoleService) {}
```

**Signals vs Observables:**
- `signal<T>()` → local UI state (dialog open, loading, selected item)
- `computed()` → derived state
- `Observable` + `takeUntil(destroy$)` → HTTP, lang change, router
- Never subscribe in templates — use `async` pipe or `toSignal()`

**`any` is forbidden.** Use `unknown` or a typed interface.

**Method ordering in every class:**
```
1. @Input / @Output / @ViewChild
2. DI (inject())
3. Public signals / state
4. Private state + destroy$
5. readonly constants
6. Lifecycle: ngOnInit → ngOnChanges → ngOnDestroy
7. Public handlers: onXxx, openXxx, closeXxx
8. Private helpers
```

---

### 3.2 HTML Template Rules

**Use Angular 17+ control flow — no `*ngIf` / `*ngFor`:**
```html
<!-- ✅ DO -->
@if (selectedItem) { <div>...</div> }
@for (item of items(); track item.id) { <div>{{ item.name }}</div> }

<!-- ❌ DON'T -->
<div *ngIf="selectedItem">...</div>
<div *ngFor="let item of items">...</div>
```

> **Exception:** The current `table.html` still uses `*ngFor`/`*ngIf` for compatibility. Don't change them in the shared table; use the new syntax in your own page templates.

**Forbidden in templates:**
- No `console.log()`
- No hardcoded user-facing strings — use `| transloco`
- No calling service methods directly from templates
- No `any` casts

---

### 3.3 Styling Rules

| Situation | Use |
|---|---|
| PrimeNG `::ng-deep` overrides | SCSS inside `:host` only |
| Responsive breakpoints | SCSS only |
| Animations / transitions | SCSS only |
| Component-specific layout | SCSS or Tailwind |
| Spacing, text, one-off color | Tailwind utility only |

**Standard breakpoints:**
```
xs: < 480px   phones portrait
sm: < 640px   phones landscape
md: < 768px   tablets portrait
lg: < 1024px  tablets landscape
```

---

### 3.4 Translation Rules

1. Every user-visible string → `| transloco`. No exceptions.
2. Every `t.translate()` in TypeScript → add a fallback: `this.t.translate('key') || 'Fallback'`
3. Every key added to `en.json` must have a matching key in `ar.json`
4. No hardcoded strings like `'Edit'`, `'Delete'`, `'Cancel'` anywhere

---

### 3.5 Import Order

```typescript
// Group 1 — Angular core
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Group 2 — Router
import { RouterModule } from '@angular/router';

// Group 3 — PrimeNG (alphabetical)
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// Group 4 — Third-party
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// Group 5 — Shared components
import { TableComponent, DialogShellComponent } from '@/app/foundation/shared';

// Group 6 — Shared pipes / directives
import { SeverityPipe } from '@/app/foundation/shared/pipes/severity.pipe';

// Group 7 — Feature-local
import { Role, emptyRoleForm } from '../models/role';
import { RoleService } from '../services/role.service';
```

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
| Status tag coloring | `[severityMap]="..."` on `<app-table>` or `| severity` pipe |
| 2-level hierarchy (parent → children) | `<app-tree-table [nestedConfig]="cfg">` |
| 3-level hierarchy | `<app-tree-table>` with nested `nestedConfig` |
| Lightweight overlay / context popup | `<app-popup-shell (dismissed)="...">` |
| Per-row inline delete confirm | `<app-delete-confirm-popup>` |
| Bulk / bottom-bar delete with confirm | `<app-delete-button>` |

---

_Guide version: 2.3 — Updated to reflect actual codebase (roles.ts, table.ts, table.html). Added cards/grid view guide, signals pattern, corrected DI style, fixed HTML template order._
