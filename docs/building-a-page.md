> اقرأ هذا القسم أول ما تبدأ أي صفحة جديدة — بيوضح علاقة الـ sidebar بالكود، وبيفرّق بين مسار الـ Flat Table ومسار الـ Tree Table.

---

### فهم الـ Sidebar — Domain / Module / Entity

الـ sidebar في `app.menu.ts` منظم على ثلاث مستويات:

```
Domain (label بدون routerLink)
  └── Module (group أو item بأيقونة)
        └── Entity (الصفحة الفعلية — بـ routerLink)
```

**مثال حي من الـ menu:**

```
Exchange                          ← Domain  (label: 'menu.exchange')
  ├── MSG                         ← Module   (label: 'menu.msg',  icon: envelope)
  │   ├── Schemas                 ← Entity   (routerLink: '/msg/schemas')
  │   └── Messages                ← Entity   (routerLink: '/msg/messages')
  └── PRC                         ← Module   (label: 'menu.prc',  icon: cog)
      ├── Processes               ← Entity   (routerLink: '/prc/processes')
      └── Conversations           ← Entity   (routerLink: '/prc/conversations')
```

```
Identity                          ← Domain
  ├── ORG                         ← Module
  │   ├── Organizations           ← Entity
  │   ├── Communities             ← Entity
  │   └── Contacts                ← Entity
  └── AUTH                        ← Module
      ├── Users                   ← Entity
      ├── Roles                   ← Entity   ← مثال Flat Table
      └── Permissions             ← Entity   ← مثال Tree Table
```

**الترجمة لكود:**

| Sidebar level | في الكود |
|---|---|
| **Domain** | مجلد في `src/app/domains/` (e.g. `msg/`, `auth/`) |
| **Module** | sub-folder داخل الـ domain (e.g. `msg/messages/`, `msg/schemas/`) |
| **Entity** | الـ page component + route (e.g. `messages.ts` → `/msg/messages`) |

---

### المسار 1 — Flat Table (مثال: Messages, Roles, Schemas)

استخدم هذا المسار لما البيانات **flat** — قائمة مباشرة من items بدون تداخل.

```
هل البيانات list بسيطة (rows مع columns)؟ → Flat Table ✅
```

#### الخطوات بالترتيب

**① بنية المجلدات**

```
src/app/domains/msg/
├── msg.routes.ts
└── messages/
    ├── pages/
    │   └── messages/
    │       ├── messages.ts       ← الـ component
    │       ├── messages.html
    │       └── messages.scss
    ├── models/
    │   └── message.model.ts
    └── services/
        └── message.service.ts
```

**② الـ Model**

```typescript
// models/message.model.ts
export interface Message {
  id:        string;
  subject:   string;
  sender:    string;
  receiver:  string;
  status:    'Delivered' | 'Pending' | 'Error';
  sentAt:    Date | null;
}
```

**③ الـ Service**

```typescript
// services/message.service.ts
@Injectable({ providedIn: 'root' })
export class MessageService extends BaseApiService<Message> {
  protected override url = '/api/messages';

  protected override mapItem(raw: any): Message {
    return {
      id:       raw.id,
      subject:  raw.subject,
      sender:   raw.sender,
      receiver: raw.receiver,
      status:   raw.status,
      sentAt:   raw.sentAt ? new Date(raw.sentAt) : null,
    };
  }
}
```

**④ الـ Component**

```typescript
// pages/messages/messages.ts
@Component({
  selector: 'app-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, TranslocoModule, ToastModule, ...],
  templateUrl: './messages.html',
  providers: [MessageService],
})
export class MessagesComponent implements OnInit {

  private readonly svc = inject(MessageService);
  private readonly t   = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ──────────────────────────────────────────────────────────────
  messages = signal<Message[]>([]);
  loading  = signal(false);

  tableColumns: TableColumn[] = [];
  statusOptions: { label: string; value: string }[] = [];
  toolbarFilters: ToolbarFilterDefinition[] = [];

  // ── Row actions ────────────────────────────────────────────────────────
  rowActionsFactory = (item: Message): MenuItem[] => [
    {
      label:   this.t.translate('actions.view') || 'View',
      icon:    'pi pi-eye',
      command: () => this.openDetail(item),
    },
    { separator: true },
    {
      label:      this.t.translate('actions.delete') || 'Delete',
      icon:       'pi pi-trash',
      styleClass: 'text-red-500',
      command:    () => this.confirmDelete(item),
    },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initColumns();

    this.t.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.initColumns());

    this.loadData();
  }

  // ── Private ────────────────────────────────────────────────────────────
  private initColumns(): void {
    this.statusOptions = [
      { label: this.t.translate('msgStatus.Delivered') || 'Delivered', value: 'Delivered' },
      { label: this.t.translate('msgStatus.Pending')   || 'Pending',   value: 'Pending'   },
      { label: this.t.translate('msgStatus.Error')     || 'Error',     value: 'Error'     },
    ];

    this.tableColumns = [
      { field: 'subject',  header: this.t.translate('messages.subject')  || 'Subject',  sortable: true  },
      { field: 'sender',   header: this.t.translate('messages.sender')   || 'Sender',   sortable: true  },
      { field: 'receiver', header: this.t.translate('messages.receiver') || 'Receiver', sortable: true  },
      { field: 'status',   header: this.t.translate('messages.status')   || 'Status',   type: 'status',
        filterOptions: this.statusOptions },
      { field: 'sentAt',   header: this.t.translate('messages.sentAt')   || 'Sent At',  type: 'date',
        sortable: true, filterable: false },
    ];

    this.toolbarFilters = [
      {
        field:     'status',
        label:     this.t.translate('messages.status') || 'Status',
        options:   this.statusOptions,
        matchMode: 'in',
      },
    ];
  }

  private loadData(): void {
    this.loading.set(true);
    this.svc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  data  => { this.messages.set(data); this.loading.set(false); },
        error: ()    => this.loading.set(false),
      });
  }

  openDetail(item: Message): void { /* ... */ }
  confirmDelete(item: Message): void { /* ... */ }
}
```

**⑤ الـ Template**

```html
<p-toast />

<app-table
  [title]="'messages.title' | transloco"
  [data]="messages()"
  [columns]="tableColumns"
  [loading]="loading()"
  [rowActions]="rowActionsFactory"
  [toolbarHasFilters]="true"
  [toolbarFilters]="toolbarFilters"
  [toolbarShowBuiltInSearch]="true"
  [statusOptions]="statusOptions"
  [useExternalForm]="true"
  (onNew)="openCreateDialog()"
/>
```

**⑥ الـ Route**

```typescript
// msg.routes.ts
export const MSG_ROUTES: Routes = [
  {
    path: 'messages',
    loadComponent: () =>
      import('./messages/pages/messages/messages').then(m => m.MessagesComponent),
  },
  {
    path: 'schemas',
    loadComponent: () =>
      import('./schemas/pages/schemas/schemas').then(m => m.SchemasComponent),
  },
];

// app.routes.ts
{
  path: 'msg',
  loadChildren: () => import('./services/msg/msg.routes').then(m => m.MSG_ROUTES),
}
```

**⑦ الـ Sidebar entry** — في `app.menu.ts`:

```typescript
{
  label: 'menu.exchange',         // Domain label
  items: [
    {
      label: 'menu.msg',          // Module
      icon:  'pi pi-fw pi-envelope',
      items: [
        {
          label:      'menu.messages',    // Entity ← الصفحة اللي بنيتها
          icon:       'pi pi-fw pi-comments',
          routerLink: ['/msg/messages'],  // ← نفس الـ path في الـ route
        },
      ],
    },
  ],
}
```

**⑧ ملف الترجمة** — `public/i18n/ar/messages.json`:

```json
{
  "messages": {
    "title":    "الرسائل",
    "subject":  "الموضوع",
    "sender":   "المرسِل",
    "receiver": "المستقبِل",
    "status":   "الحالة",
    "sentAt":   "وقت الإرسال"
  },
  "msgStatus": {
    "Delivered": "تم التسليم",
    "Pending":   "قيد الانتظار",
    "Error":     "خطأ"
  }
}
```

ثم أضف `messages: this.load(lang, 'messages')` في `forkJoin` داخل `transloco-loader.ts`.

---

### المسار 2 — Tree Table (مثال: Permissions)

استخدم هذا المسار لما البيانات **هرمية** — كل parent عنده children.

```
هل البيانات على مستويين أو أكثر (Module → Entity → Item)؟ → Tree Table ✅
```

#### الخطوات بالترتيب

**① بنية المجلدات**

```
src/app/domains/auth/
├── auth.routes.ts
└── permissions/
    ├── pages/
    │   └── permissions/
    │       ├── permissions.ts
    │       ├── permissions.html
    │       └── permissions.scss
    ├── models/
    │   └── permission.model.ts      ← PermissionData, RoleState, ActiveColFilters...
    ├── services/
    │   └── permissions-data.service.ts
    └── helpers/
        └── permissions.columns.ts   ← buildEntityColumns(), buildPermissionColumns()
```

**② الـ Models** (أكثر تعقيداً من الـ flat)

```typescript
// permission.model.ts
export type PermissionStatus = 'Active' | 'Inactive' | 'Pending';
export type PermissionAction = 'View' | 'Create' | 'Update' | 'Delete' | 'Export';

export interface RoleState {
  checked:       boolean;
  indeterminate: boolean; // ← مهم للـ entity dialog (partial selection)
}

export interface ActiveSort {
  field: string;
  order: 1 | -1;
  level: 'entity' | 'child'; // ← sort على الـ parent أو الـ child منفصلاً
}

export interface ActiveColFilters {
  entityName:   { matchMode: string; value: string | null } | null;
  entityStatus: string[];
  childName:    { matchMode: string; value: string | null } | null;
  childStatus:  string[];
  childAction:  string[];
}

export const EMPTY_COL_FILTERS: ActiveColFilters = {
  entityName: null, entityStatus: [], childName: null, childStatus: [], childAction: [],
};
```

**③ الـ Column Builders** — في ملف منفصل

```typescript
// helpers/permissions.columns.ts
export function buildEntityColumns(t, catOpts, statusOpts): TreeTableColumn[] {
  return [
    { field: 'name',   columnId: 'entity-name',   header: t.translate('permissions.entityName'),  sortable: true, filterable: true },
    { field: 'status', columnId: 'entity-status',  header: t.translate('permissions.status'),
      cellType: 'tag', translatePrefix: 'permissionStatus',
      severityMap: { Active: 'success', Pending: 'warn', Inactive: 'secondary' },
      filterOptions: statusOpts },
    { field: 'assignedRolesCount', columnId: 'entity-roles', header: t.translate('permissions.assignedRoles'), sortable: true },
  ];
}

export function buildPermissionColumns(t, statusOpts, actionOpts): TreeTableColumn[] {
  return [
    { field: 'name',              columnId: 'child-name',   header: t.translate('permissions.permissionName'), sortable: true, filterable: true },
    { field: 'status',            columnId: 'child-status', header: t.translate('permissions.status'),
      cellType: 'tag', translatePrefix: 'permissionStatus', filterOptions: statusOpts },
    { field: 'action',            columnId: 'child-action', header: t.translate('permissions.actionType'), filterOptions: actionOpts },
    { field: 'assignedRolesCount',columnId: 'child-roles',  header: t.translate('permissions.assignedRoles'), sortable: true },
  ];
}
```

**④ الـ Service** — مختلف لأن الداتا مش flat

```typescript
// services/permissions-data.service.ts
@Injectable({ providedIn: 'root' })
export class PermissionsDataService extends BaseApiService<PermissionsJson> {
  protected override url = '/api/permissions.mock.json';
  private readonly t = inject(TranslocoService);

  // الـ JSON مش envelope — override الـ mapping
  protected override mapItem(raw: PermissionsJson): PermissionsJson { return raw; }
  protected override getItems(r: PermissionsJson): PermissionsJson[] { return [r]; }

  private load() { return this.http.get<PermissionsJson>(this.url); }

  // بيرجع TreeModule[] — مش flat array
  getData$(): Observable<{ modules: TreeModule[]; roles: Role[] }> {
    return this.t.langChanges$.pipe(
      switchMap(() => this.load()),
      map(json => ({
        modules: json.modules.map(m => this.buildModule(m)),
        roles:   json.roles.map(r => ({ id: r.id, name: this.t.translate(r.name), type: r.type })),
      })),
    );
  }

  getRoleAssignments$(): Observable<[string, string[]][]> {
    return this.load().pipe(
      map(json => json.roleAssignments.map(a => [a.permissionKey, a.roleIds] as [string, string[]]))
    );
  }
}
```

**⑤ الـ Component** — signals أكثر + computed للـ sort والـ filter

```typescript
@Component({ ... })
export class PermissionsComponent implements OnInit {

  // ── Core state ─────────────────────────────────────────────────────────
  rawModules      = signal<TreeModule[]>([]);
  availableRoles  = signal<Role[]>([]);
  roleAssignments = signal<Map<string, string[]>>(new Map());
  entityColumns   = signal<TreeTableColumn[]>([]);
  permColumns     = signal<TreeTableColumn[]>([]);
  layoutMode      = signal<'list' | 'grid'>('list');

  // ── Filter & sort state (lifted from tree-table to parent) ─────────────
  globalSearchText     = signal('');
  selectedModuleFilters = signal<string[]>([]);
  activeSort           = signal<ActiveSort>({ field: '', order: 1, level: 'entity' });
  activeColFilters     = signal<ActiveColFilters>({ ...EMPTY_COL_FILTERS });

  // ── Computed: sort ─────────────────────────────────────────────────────
  readonly sortedEntitiesMap = computed(() => {
    const { field, order, level } = this.activeSort();
    const map = new Map<string, TreeNode[]>();
    this.rawModules().forEach(mod => {
      let entities = [...mod.entities];
      if (level === 'entity' && field)
        entities.sort((a, b) => String(a.data[field] ?? '').localeCompare(String(b.data[field] ?? '')) * order);
      if (level === 'child' && field)
        entities = entities.map(e => ({
          ...e,
          children: [...(e.children ?? [])].sort((a, b) =>
            String(a.data[field] ?? '').localeCompare(String(b.data[field] ?? '')) * order
          ),
        }));
      map.set(mod.name, entities);
    });
    return map;
  });

  // ── Computed: filter ───────────────────────────────────────────────────
  readonly filteredModules = computed(() => {
    const query   = this.globalSearchText().trim().toLowerCase();
    const modF    = this.selectedModuleFilters();
    const colF    = this.activeColFilters();
    let modules   = this.rawModules();

    if (modF.length) modules = modules.filter(m => modF.includes(m.name));
    // ... تطبيق باقي الفلاتر على الـ entities والـ children

    return modules;
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  onSortChanged(event: TreeTableSortEvent): void {
    this.activeSort.set({ field: event.field, order: event.order, level: event.level });
  }

  onColFilterChanged(event: TreeTableColFilterEvent): void {
    const f = { ...this.activeColFilters() };
    if (event.columnId === 'entity-name')   f.entityName   = event.text ?? null;
    if (event.columnId === 'entity-status') f.entityStatus = event.opts ?? [];
    if (event.columnId === 'child-name')    f.childName    = event.text ?? null;
    if (event.columnId === 'child-status')  f.childStatus  = event.opts ?? [];
    if (event.columnId === 'child-action')  f.childAction  = event.opts ?? [];
    this.activeColFilters.set(f);
  }

  ngOnInit(): void {
    // بذر الـ role assignments مرة واحدة
    this.dataService.getRoleAssignments$().pipe(take(1))
      .subscribe(seed => this.roleAssignments.set(new Map(seed)));

    // الداتا المترجمة — بتتحدث مع اللغة
    this.dataService.getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ modules, roles }) => {
        this.rawModules.set(modules);
        this.availableRoles.set(roles);
        this.buildColumnDefs();
      });
  }
}
```

**⑥ الـ Template** — التولبار خارج الـ tree-table

```html
<p-toast />

<!-- التولبار ملك الـ host لأنه بيحتوي على layout toggle وفلاتر مخصصة -->
<app-shared-toolbar
  [title]="'permissions.title' | transloco"
  [hasFilters]="true"
  [showBuiltInSearch]="true"
  [searchValue]="globalSearchText()"
  (searchChanged)="globalSearchText.set($event)"
  (clearSearch)="clearFilters()"
  (onExport)="exportToCSV()"
>
  <ng-container toolbar-filters>
    <app-filter [label]="'permissions.filters.module' | transloco"
      [options]="moduleFilterOptions()" [selected]="selectedModuleFilters()"
      (selectedChange)="selectedModuleFilters.set($event)" />
    <app-filter [label]="'permissions.filters.entityStatus' | transloco"
      [options]="statusFilterOptions()" [selected]="selectedStatusFilters()"
      (selectedChange)="selectedStatusFilters.set($event)" />
  </ng-container>
  <ng-container toolbar-extra>
    <div class="flex gap-1">
      <p-button icon="pi pi-th-large"
        [severity]="layoutMode() === 'grid' ? 'primary' : 'secondary'"
        (onClick)="layoutMode.set('grid')" />
      <p-button icon="pi pi-list"
        [severity]="layoutMode() === 'list' ? 'primary' : 'secondary'"
        (onClick)="layoutMode.set('list')" />
    </div>
  </ng-container>
</app-shared-toolbar>

<!-- Tree Table — [showToolbar]="false" لأن التولبار فوق -->
<app-tree-table
  [modules]="filteredModules()"
  [sortedEntitiesMap]="sortedEntitiesMap()"
  [roleAssignments]="roleAssignments()"
  [entityColumns]="entityColumns()"
  [childColumns]="permColumns()"
  [availableRoles]="availableRoles()"
  [groupByModule]="true"
  [showToolbar]="false"
  [showLayoutToggle]="true"
  [layoutInput]="layoutMode()"
  (entityEdit)="openEntityEdit($event)"
  (itemEdit)="openPermissionEdit($event)"
  (entitySelectionChange)="onEntitySelectionChange($event)"
  (itemSelectionChange)="onPermissionSelectionChange($event)"
  (colFilterChanged)="onColFilterChanged($event)"
  (sortChanged)="onSortChanged($event)"
/>

<!-- Bulk action bar — يظهر لما يتحدد items -->
<app-shared-bottom-bar
  [visible]="selectedPermissions().length > 0"
  [count]="selectedPermissions().length"
  itemLabel="permission"
  [showDelete]="false"
  [actions]="[{ key: 'bulk-edit', label: ('permissions.bulkEdit' | transloco), icon: 'pi pi-pencil', severity: 'secondary' }]"
  (bulkAction)="onBottomBarAction($event)"
  (clearSelection)="clearSelection()"
/>
```

**⑦ الـ Route**

```typescript
// auth.routes.ts
export const AUTH_ROUTES: Routes = [
  {
    path: 'permissions',
    loadComponent: () =>
      import('./permissions/pages/permissions/permissions').then(m => m.PermissionsComponent),
  },
];
```

**⑧ الـ Sidebar entry** — في `app.menu.ts`:

```typescript
{
  label: 'menu.identity',       // Domain
  items: [
    {
      label: 'menu.auth',       // Module
      icon:  'pi pi-fw pi-user',
      items: [
        {
          label:      'menu.permissions',     // Entity ← الصفحة اللي بنيتها
          icon:       'pi pi-fw pi-lock',
          routerLink: ['/auth/permissions'],  // ← نفس الـ path في الـ route
        },
      ],
    },
  ],
}
```

---

### مقارنة سريعة — متى تختار أيهما؟

| المعيار | Flat Table | Tree Table |
|---|---|---|
| **شكل البيانات** | قائمة مستوية (rows) | هرمي (parent → children) |
| **المكوّن** | `<app-table>` | `<app-tree-table>` |
| **التولبار** | مدمج داخل `<app-table>` | منفصل في الـ host (`<app-shared-toolbar>`) |
| **الـ columns** | `TableColumn[]` في الـ component | `buildEntityColumns()` + `buildPermissionColumns()` في ملف منفصل |
| **الـ sort** | داخلي في `<app-table>` | `sortedEntitiesMap` computed في الـ parent |
| **الـ filter** | داخلي في `<app-table>` | `filteredModules` computed في الـ parent |
| **الـ service** | `extends BaseApiService<T>` بسيط | override `mapItem` + `getItems` + `getData$()` مخصص |
| **الـ model** | interface بسيط | `ActiveSort` + `ActiveColFilters` + `RoleState` |
| **bulk actions** | مدمج في `<app-table>` | `<app-shared-bottom-bar>` منفصل |
| **أمثلة** | Messages, Roles, Schemas, Visits | Permissions |
