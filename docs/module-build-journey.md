## Module Build Journey

> Follow these steps **in order** for every new module.

---

### Step 1 — Create the folder structure

```
src/app/domains/{module-name}/
├── {module-name}.routes.ts
├── feature.ts
├── index.ts
│
└── {feature-name}/               ← one folder per entity (e.g. roles, users)
    ├── components/
    │   └── {component-name}/
    │       ├── {component-name}.ts
    │       ├── {component-name}.html
    │       └── {component-name}.scss
    ├── pages/
    │   └── {page-name}/
    │       ├── {page-name}.ts
    │       ├── {page-name}.html
    │       └── {page-name}.scss
    ├── models/
    │   └── {entity}.model.ts
    ├── services/
    │   └── {entity}.service.ts
    ├── constants/
    │   └── {entity}.constants.ts
    └── helpers/
        └── {entity}.helpers.ts
```

**Real-world example — `auth` module:**

```
modules/auth/
├── roles/
│   ├── pages/roles/       ← roles.ts  roles.html  roles.scss
│   ├── models/role.ts
│   ├── services/role.service.ts
│   └── constants/role.constants.ts
├── users/
│   └── pages/users-list/
├── permissions/
│   └── pages/permissions/
└── role-details/
    └── pages/role-details/
```

**Rules:**
- `pages/` = routable components (loaded by the router)
- `components/` = non-routable UI pieces used inside pages
- `helpers/` = pure functions only — no `inject()`, no side effects
- A component used in 2+ features must move to `shared/components/`

---

### Step 2 — Define the model

```typescript
// models/role.ts
export interface Role {
  id: number;
  name_code: string;
  category: string;
  community: string;
  status: string;
  description: string;
  noOfUsers: number;
  noOfPermissions: number;
}

export function emptyRoleForm() {
  return { name_en: '', name_ar: '', status: '', category: '', community: '', description: '' };
}

export function roleToEditForm(role: Partial<Role>) {
  return {
    id: role.id,
    name: role.name_code ?? '',
    description: role.description ?? '',
    status: role.status ?? '',
    category: role.category ?? '',
    community: role.community ?? ''
  };
}
```

---

### Step 3 — Define constants

```typescript
// constants/role.constants.ts
export const ROLE_SEVERITY_MAP: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
  Active:   'success',
  Inactive: 'secondary',
  Pending:  'warn',
};
```

---

### Step 4 — Create the service

```typescript
// services/role.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../models/role';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/roles');
  }

  create(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>('/api/roles', role);
  }

  update(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`/api/roles/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/roles/${id}`);
  }
}
```

---

### Step 5 — Set up the routes

```typescript
// auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'roles',
    loadComponent: () =>
      import('./roles/pages/roles/roles').then(m => m.RolesPage)
  }
];
```

---

### Step 6 — Build the page component (`.ts`)

> Use `inject()` for all DI — no constructor injection.
> Use `signal()` for local UI state.

```typescript
// pages/roles/roles.ts
import { Component, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { TableComponent, DialogShellComponent } from '@/app/foundation/shared';
import { TableColumn, ToolbarFilterDefinition } from '@/app/foundation/shared/models/table.models';
import { SeverityPipe } from '@/app/foundation/shared/pipes/severity.pipe';
import { uniqueOptions } from '@/app/foundation/shared/utils/table.utils';
import { RoleService } from '../services/role.service';
import { Role, emptyRoleForm, roleToEditForm } from '../models/role';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslocoModule,
    ButtonModule, TagModule, ToastModule, ConfirmDialogModule,
    SelectModule, InputTextModule, Menu,
    TableComponent, DialogShellComponent, SeverityPipe
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  providers: [RoleService, MessageService, ConfirmationService]
})
export class RolesPage implements OnInit, OnDestroy {

  // ── DI ───────────────────────────────────────────────────────────────────
  private roleService        = inject(RoleService);
  private messageService     = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private t                  = inject(TranslocoService);

  // ── State ────────────────────────────────────────────────────────────────
  private destroy$ = new Subject<void>();

  roles   = signal<Role[]>([]);
  loading = signal(false);

  // ── Table config ─────────────────────────────────────────────────────────
  readonly tableColumns: TableColumn[] = [
    { field: 'name_code',       header: 'Role Name',   sortable: true, filterable: true },
    { field: 'category',        header: 'Category',    sortable: true, filterable: true },
    { field: 'community',       header: 'Community',   sortable: true, filterable: true },
    { field: 'status',          header: 'Status',      type: 'status', sortable: true  },
    { field: 'noOfUsers',       header: 'Total Users', type: 'numeric', sortable: true },
    { field: 'noOfPermissions', header: 'Permissions', type: 'numeric', sortable: true },
    { field: 'description',     header: 'Description' }
  ];

  toolbarFilters: ToolbarFilterDefinition[] = [];
  statusOptions:     { label: string; value: string }[] = [];
  categoriesOptions: { label: string; value: string }[] = [];
  communitiesOptions: { label: string; value: string }[] = [];

  // ── Row actions factory ───────────────────────────────────────────────────
  rowActionsFactory = (item: Role): MenuItem[] => [
    { label: this.t.translate('actions.view') || 'View Details', icon: 'pi pi-eye',
      routerLink: ['/auth/roles/permissions'] },
    { label: this.t.translate('actions.edit') || 'Edit Role',   icon: 'pi pi-pencil',
      command: () => this.openEditDialog(item) },
    { separator: true },
    { label: this.t.translate('actions.delete') || 'Delete Role', icon: 'pi pi-trash',
      styleClass: 'text-red-500', command: () => this.confirmDelete(item) }
  ];

  // ── Card-view menu (shared, model swapped per card) ────────────────────────
  @ViewChild('cardMenu') cardMenu!: Menu;
  activeCardMenuItems: MenuItem[] = [];

  openCardMenu(event: MouseEvent, item: Role): void {
    this.activeCardMenuItems = this.rowActionsFactory(item);
    this.cardMenu.toggle(event);
  }

  // ── Create dialog ─────────────────────────────────────────────────────────
  createDialogVisible = false;
  newRole = emptyRoleForm();

  openCreateDialog(): void {
    this.newRole = emptyRoleForm();
    this.createDialogVisible = true;
  }

  saveRole(): void {
    const { name_en, name_ar, status, category, community, description } = this.newRole;
    if (!name_en || !name_ar || !category || !community) {
      this.toast('error', this.t.translate('roles.messages.allFieldsRequired'));
      return;
    }

    const newItem: Role = {
      id: Math.floor(1000 + Math.random() * 9000),
      name_code: name_en, category, community, status, description,
      noOfUsers: 0, noOfPermissions: 0
    };

    this.roles.update(list => [newItem, ...list]);
    this.refreshFilterOptions();
    this.createDialogVisible = false;
    this.toast('success', this.t.translate('roles.messages.created'));
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────
  editDialogVisible = false;
  editForm = roleToEditForm({});

  openEditDialog(role: Role): void {
    this.editForm = roleToEditForm(role);
    this.editDialogVisible = true;
  }

  saveEdit(): void {
    this.roles.update(list => {
      const idx = list.findIndex(r => r.id === this.editForm.id);
      if (idx === -1) return list;
      const updated = [...list];
      updated[idx] = { ...updated[idx],
        name_code: this.editForm.name, description: this.editForm.description,
        status: this.editForm.status, category: this.editForm.category,
        community: this.editForm.community
      };
      return updated;
    });
    this.refreshFilterOptions();
    this.editDialogVisible = false;
    this.toast('success', this.t.translate('roles.messages.updated'));
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(item: Role): void {
    this.confirmationService.confirm({
      header: this.t.translate('roles.messages.deleteTitle'),
      message: this.t.translate('roles.messages.deleteMessage'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.t.translate('actions.delete'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.t.translate('actions.cancel'),
      accept: () => {
        this.roles.update(list => list.filter(r => r.id !== item.id));
        this.refreshFilterOptions();
        this.toast('success', this.t.translate('roles.messages.deleted'));
      }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loading.set(true);
    this.roleService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.roles.set(data);
        this.loading.set(false);
        this.refreshFilterOptions();
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private refreshFilterOptions(): void {
    const list = this.roles();
    this.statusOptions     = uniqueOptions(list, 'status');
    this.categoriesOptions = uniqueOptions(list, 'category');
    this.communitiesOptions = uniqueOptions(list, 'community');

    this.toolbarFilters = [
      { field: 'status',    label: this.t.translate('roles.filter.selectStatus')    || 'Status',    options: this.statusOptions,     matchMode: 'in' },
      { field: 'category',  label: this.t.translate('roles.filter.selectCategory')  || 'Category',  options: this.categoriesOptions,  matchMode: 'in' },
      { field: 'community', label: this.t.translate('roles.filter.selectCommunity') || 'Community', options: this.communitiesOptions, matchMode: 'in' }
    ];
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({
      severity,
      summary: this.t.translate(severity === 'success' ? 'roles.messages.success' : 'roles.messages.error'),
      detail
    });
  }
}
```

---

### Step 7 — Build the HTML template (`.html`)

**Required layout order:**
1. Global overlays (`p-toast`, `p-confirmdialog`)
2. Main content (`app-table`)
3. Dialogs

```html
<!-- ── Global overlays ────────────────────────────────────── -->
<p-confirmdialog [style]="{ width: '450px' }" styleClass="app-dialog-md" [dismissableMask]="true" />
<p-toast />

<!-- ── Main table (includes toolbar + bottom bar internally) ── -->
<app-table
  title="Roles"
  [data]="roles()"
  [columns]="tableColumns"
  [statusOptions]="statusOptions"
  [rowActions]="rowActionsFactory"
  [toolbarShowAdd]="true"
  [toolbarHasFilters]="true"
  [toolbarFilters]="toolbarFilters"
  [showLayoutToggle]="true"
  [useExternalForm]="true"
  [loading]="loading()"
  (onNew)="openCreateDialog()"
>
  <!-- Card template — projected into grid/cards view -->
  <ng-template #cardTemplate let-item>
    <div class="bg-surface-0 dark:bg-surface-900 rounded-md p-6 flex flex-col gap-4">
      <div class="flex justify-between">
        <div>
          <p class="text-xl font-semibold">{{ item.name_code }}</p>
          <span class="text-surface-500">{{ item.category }}, {{ item.community }}</span>
        </div>
        <p-tag [value]="item.status" [severity]="item.status | severity" />
      </div>
      <div class="flex justify-between items-end">
        <span>{{ item.noOfUsers }} users</span>
        <p-button icon="pi pi-ellipsis-v" severity="secondary" [outlined]="true"
          (click)="openCardMenu($event, item)" />
      </div>
    </div>
  </ng-template>
</app-table>

<!-- Shared card menu (model swapped per card) -->
<p-menu #cardMenu [popup]="true" appendTo="body" [model]="activeCardMenuItems" />

<!-- ── Create dialog ──────────────────────────────────────── -->
<app-dialog-shell
  [header]="'roles.form.createTitle' | transloco"
  [(visible)]="createDialogVisible"
  [saveDisabled]="!newRole.name_en || !newRole.name_ar || !newRole.category || !newRole.community"
  (save)="saveRole()"
  (cancelled)="createDialogVisible = false"
>
  <ng-template #dialogContent>
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-col gap-1">
        <label class="font-bold text-sm">{{ 'roles.form.roleName' | transloco }}</label>
        <input pInputText [(ngModel)]="newRole.name_en" dir="ltr"
          [placeholder]="'roles.form.roleNamePlaceholder' | transloco" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-bold text-sm">{{ 'roles.form.roleNameAr' | transloco }}</label>
        <input pInputText [(ngModel)]="newRole.name_ar" dir="rtl" class="text-right"
          [placeholder]="'roles.form.roleNameArPlaceholder' | transloco" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-bold text-sm">{{ 'roles.form.status' | transloco }}</label>
        <p-select [options]="statusOptions" [(ngModel)]="newRole.status"
          [placeholder]="'roles.form.selectStatus' | transloco" appendTo="body" class="w-full" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-bold text-sm">{{ 'roles.form.category' | transloco }}</label>
        <p-select [options]="categoriesOptions" [(ngModel)]="newRole.category"
          [placeholder]="'roles.form.selectCategory' | transloco" appendTo="body" class="w-full" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-bold text-sm">{{ 'roles.form.community' | transloco }}</label>
        <p-select [options]="communitiesOptions" [(ngModel)]="newRole.community"
          [placeholder]="'roles.form.selectCommunity' | transloco" appendTo="body" class="w-full" />
      </div>
    </div>
  </ng-template>
</app-dialog-shell>

<!-- ── Edit dialog ────────────────────────────────────────── -->
<app-dialog-shell
  [header]="'roles.form.editTitle' | transloco"
  [(visible)]="editDialogVisible"
  [saveDisabled]="!editForm.name || !editForm.status || !editForm.category || !editForm.community"
  (save)="saveEdit()"
  (cancelled)="editDialogVisible = false"
>
  <ng-template #dialogContent>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="font-semibold">{{ 'roles.form.name' | transloco }}</label>
        <input pInputText [(ngModel)]="editForm.name" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-semibold">{{ 'roles.form.status' | transloco }}</label>
        <p-select [options]="statusOptions" [(ngModel)]="editForm.status" appendTo="body" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-semibold">{{ 'roles.form.category' | transloco }}</label>
        <p-select [options]="categoriesOptions" [(ngModel)]="editForm.category" appendTo="body" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="font-semibold">{{ 'roles.form.community' | transloco }}</label>
        <p-select [options]="communitiesOptions" [(ngModel)]="editForm.community" appendTo="body" />
      </div>
    </div>
  </ng-template>
</app-dialog-shell>
```

---

### Step 8 — Scoped SCSS (`.scss`)

```scss
// pages/roles/roles.scss

// Required: all ::ng-deep overrides must live inside this scope
:host {
  display: flex;
  flex-direction: column;
}

// PrimeNG overrides (always inside :host)
:host ::ng-deep {
  .p-tag {
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }
}

// Responsive
@media (max-width: 768px) {
  :host {
    padding-inline: 0.5rem;
  }
}
```

---

### Step 9 — Add translation keys

Every key used in the component must exist in both `en.json` and `ar.json`:

```json
// en.json (partial)
{
  "roles": {
    "form": {
      "createTitle": "Create Role",
      "editTitle": "Edit Role",
      "roleName": "Role Name (EN)",
      "roleNameAr": "Role Name (AR)",
      "roleNamePlaceholder": "Enter role name in English",
      "roleNameArPlaceholder": "أدخل اسم الدور بالعربية",
      "status": "Status",
      "category": "Category",
      "community": "Community",
      "selectStatus": "Select status",
      "selectCategory": "Select category",
      "selectCommunity": "Select community"
    },
    "filter": {
      "selectStatus": "Status",
      "selectCategory": "Category",
      "selectCommunity": "Community"
    },
    "messages": {
      "success": "Success",
      "error": "Error",
      "created": "Role created successfully",
      "updated": "Role updated successfully",
      "deleted": "Role deleted successfully",
      "allFieldsRequired": "All required fields must be filled",
      "deleteTitle": "Delete Role",
      "deleteMessage": "Are you sure you want to delete this role?"
    }
  }
}
```

---

### Step 10 — Wire the route

In `app.routes.ts` or the parent feature routes:

```typescript
{
  path: 'auth',
  loadChildren: () =>
    import('./services/auth/auth.routes').then(m => m.AUTH_ROUTES)
}
```