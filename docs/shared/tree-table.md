### `<app-tree-table>` — `TreeTableComponent`

**File:** `src/app/shared/components/tree-table/tree-table.ts`

مكوّن متخصص لعرض بيانات هرمية (Module → Entity → Permission) مع دعم كامل للـ sort، column filters، selection، role assignments، وبديلين للعرض: جدول (list) وكروت (grid). يستخدمه Permissions page كمثال رئيسي.

> **متى تستخدمه؟** لما عندك بيانات على مستويين أو ثلاثة (parent → children أو parent → children → grandchildren). لو البيانات flat، استخدم `<app-table>` بدلاً منه.

---

#### الـ Interfaces الأساسية

```typescript
// الوحدة الكبيرة (Module) — تجمع مجموعة من الـ Entities
export interface TreeModule {
  name: string;
  entities: TreeNode[];
}

// العقدة (Entity أو Permission) — مستخدمة في كل المستويات
export interface TreeNode {
  key: string;          // مُعرّف فريد (e.g. 'entity.users', 'perm.users.view')
  data: TreeNodeData;   // الحقول المعروضة
  children?: TreeNode[]; // موجودة فقط في الـ parent nodes
}

export interface TreeNodeData {
  code?: string;
  name: string;
  assignedRolesCount?: number;
  [key: string]: unknown; // أي حقول إضافية
}

// Role — يُمرّر كـ availableRoles
export interface Role {
  id: string;
  name: string;
  type: 'admin' | 'management' | 'content' | 'readonly' | 'audit' | 'support';
}

// Column descriptor — نفس المفهوم زي TableColumn بس للـ tree
export interface TreeTableColumn {
  field: string;
  columnId?: string;         // مُعرّف فريد للـ column filter events
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[]; // multi-select في الـ popover
  minWidth?: string;
  cellType?: 'tag' | 'code' | 'roles' | 'text' | 'org-name';
  translatePrefix?: string;  // لو cellType='tag'، بيترجم القيمة تلقائياً
  severityMap?: Record<string, 'success' | 'warn' | 'secondary' | 'danger' | 'info'>;
  defaultMatchMode?: 'contains' | 'startsWith' | 'endsWith' | 'equals';
}
```

---

#### Inputs

| Input | Type | Default | What it does |
|---|---|---|---|
| `modules` | `TreeModule[]` | `[]` | الداتا الكاملة (بعد الـ filter من الـ parent) |
| `sortedEntitiesMap` | `Map<string, TreeNode[]>` | `new Map()` | Entities مرتبة لكل module بعد الـ sort |
| `roleAssignments` | `Map<string, string[]>` | `new Map()` | ربط كل permission key بقائمة role IDs |
| `expandedRows` | `{ [key: string]: boolean }` | `{}` | الـ rows المفتوحة (two-way بالـ reference) |
| `selectedEntities` | `TreeNode[]` | `[]` | الـ entities المحددة |
| `selectedItems` | `TreeNode[]` | `[]` | الـ children (permissions) المحددة |
| `availableRoles` | `Role[]` | `[]` | قائمة الـ roles لعرضها في الـ cell |
| `entityColumns` | `TreeTableColumn[]` | `[]` | أعمدة الـ parent row |
| `childColumns` | `TreeTableColumn[]` | `[]` | أعمدة الـ child row |
| `grandchildColumns` | `TreeTableColumn[]` | `[]` | أعمدة المستوى الثالث (اختياري) |
| `grandchildLabel` | `string` | `''` | عنوان المستوى الثالث |
| `groupByModule` | `boolean` | `false` | يعرض اسم الـ module كـ heading |
| `showToolbar` | `boolean` | `true` | يعرض/يخفي التولبار الداخلي |
| `showLayoutToggle` | `boolean` | `false` | يعرض زرّي Table/Cards داخل التولبار |
| `layoutInput` | `'list' \| 'grid'` | `'list'` | يربط الـ layout بـ signal خارجي |
| `title` | `string` | `''` | عنوان التولبار الداخلي (لو `showToolbar=true`) |
| `toolbarShowAdd` | `boolean` | `false` | زرار Add في التولبار الداخلي |
| `toolbarFilters` | `ToolbarFilterDefinition[]` | `[]` | فلاتر التولبار الداخلي |
| `entityActionLabel` | `string` | `''` | تسمية action الـ entity في الـ context menu |
| `showEntityAddChild` | `boolean` | `false` | يضيف "Add Child" للـ entity menu |
| `showItemAddChild` | `boolean` | `false` | يضيف "Add Child" للـ item menu |
| `nestedConfig` | `NestedTableConfig` | `undefined` | config يدوي للـ nesting بدل entityColumns/childColumns |
| `pagination` | `PaginationConfig` | `undefined` | تفعيل الـ pagination |

#### Outputs

| Output | Payload | When fired |
|---|---|---|
| `entityEdit` | `TreeNode` | كليك Edit على entity |
| `entityDelete` | `TreeNode` | كليك Delete على entity |
| `entityAddChild` | `TreeNode` | كليك Add Child على entity |
| `itemEdit` | `string` (key) | كليك Edit على child item |
| `itemDelete` | `string` (key) | كليك Delete على child item |
| `itemAddChild` | `string` (key) | كليك Add Child على item |
| `grandchildEdit` | `string` (key) | كليك Edit على grandchild |
| `entitySelectionChange` | `TreeNode[]` | تغيير selection الـ entities |
| `itemSelectionChange` | `TreeNode[]` | تغيير selection الـ items |
| `colFilterChanged` | `TreeTableColFilterEvent` | تطبيق column filter |
| `sortChanged` | `TreeTableSortEvent` | تغيير الـ sort |
| `addClicked` | `void` | كليك Add في التولبار الداخلي |

---

#### `TreeTableColFilterEvent` و `TreeTableSortEvent`

```typescript
// بيتبعث لما المستخدم يفلتر من الـ column header
export interface TreeTableColFilterEvent {
  columnId: string;
  text?: { matchMode: string; value: string | null } | null; // للـ text columns
  opts?: string[]; // للـ multi-select columns
}

// بيتبعث لما المستخدم يضغط sort على أي column
export interface TreeTableSortEvent {
  field: string;
  order: 1 | -1;
  level: 'entity' | 'child'; // هل الـ sort على الـ parent أو الـ child
}
```

---

#### `cellType` — أنواع الخلايا

| cellType | الاستخدام |
|---|---|
| `'tag'` | يعرض قيمة كـ `p-tag` ملوّنة — يحتاج `severityMap` و `translatePrefix` |
| `'roles'` | يعرض عدد الـ roles المعيّنة مع أيقونة |
| `'code'` | يعرض القيمة بـ monospace (كود) |
| `'text'` | عرض نصي عادي (الـ default) |
| `'org-name'` | عرض متخصص لأسماء المنظمات |

---

#### الاستخدام الكامل — مثال Permissions Page

##### 1. بناء الأعمدة (`permissions.columns.ts`)

افصل بناء الأعمدة في ملف منفصل وادعيها في `ngOnInit` وعند تغيير اللغة:

```typescript
// permissions.columns.ts
import { TranslocoService } from '@jsverse/transloco';
import { TreeTableColumn }  from '@/app/foundation/shared/components/tree-table/tree-table';
import { FilterOption }     from './permission.model';

export function buildEntityColumns(
  t:          TranslocoService,
  catOpts:    FilterOption[],
  statusOpts: FilterOption[],
): TreeTableColumn[] {
  return [
    {
      field:      'name',
      header:     t.translate('permissions.entityName') || 'Entity Name',
      columnId:   'entity-name',   // ← مهم: يُستخدم في colFilterChanged
      sortable:   true,
      filterable: true,
      minWidth:   '220px',
    },
    {
      field:        'status',
      header:       t.translate('permissions.status') || 'Status',
      columnId:     'entity-status',
      sortable:     true,
      filterable:   true,
      filterOptions: statusOpts,   // ← multi-select في الـ popover
      cellType:     'tag',
      translatePrefix: 'permissionStatus',
      severityMap:  { Active: 'success', Pending: 'warn', Inactive: 'secondary' },
      minWidth:     '130px',
    },
    {
      field:      'assignedRolesCount',
      header:     t.translate('permissions.assignedRoles') || 'Assigned Roles',
      columnId:   'entity-roles',
      sortable:   true,
      filterable: false,           // ← الأرقام عادةً مش فيها filter popover
      minWidth:   '140px',
    },
  ];
}

export function buildPermissionColumns(
  t:          TranslocoService,
  statusOpts: FilterOption[],
  actionOpts: FilterOption[],
): TreeTableColumn[] {
  return [
    {
      field:        'action',
      header:       t.translate('permissions.actionType') || 'Action Type',
      columnId:     'child-action',
      sortable:     true,
      filterable:   true,
      filterOptions: actionOpts,
      minWidth:     '140px',
    },
    // ... باقي الأعمدة
  ];
}

// Filter option builders — تترجم مع تغيير اللغة
export function buildStatusOptions(t: TranslocoService): FilterOption[] {
  return (['Active', 'Inactive', 'Pending'] as const).map(s => ({
    label: t.translate(`permissionStatus.${s}`) || s,
    value: s,
  }));
}
```

##### 2. الـ Component (`permissions.ts`)

```typescript
@Component({ ... })
export class PermissionsComponent implements OnInit {

  // ── Signals ─────────────────────────────────────────────────────────────
  rawModules        = signal<Module[]>([]);
  availableRoles    = signal<Role[]>([]);
  roleAssignments   = signal<Map<string, string[]>>(new Map());

  entityColumns     = signal<PermTableColumn[]>([]);
  permColumns       = signal<PermTableColumn[]>([]);

  selectedEntities  = signal<PermissionNode[]>([]);
  selectedPermissions = signal<PermissionNode[]>([]);

  layoutMode        = signal<'list' | 'grid'>('list');

  // activeSort و activeColFilters لازم يتحملوا في الـ parent
  // عشان الـ filteredModules computed يعرف يشتغل عليهم
  activeSort        = signal<ActiveSort>({ field: '', order: 1, level: 'entity' });
  activeColFilters  = signal<ActiveColFilters>({ ...EMPTY_COL_FILTERS });

  // ── sortedEntitiesMap — computed من rawModules + activeSort ─────────────
  readonly sortedEntitiesMap = computed<Map<string, TreeNode[]>>(() => {
    const { field, order, level } = this.activeSort();
    const map = new Map<string, TreeNode[]>();

    this.rawModules().forEach(mod => {
      let entities = [...mod.entities];

      if (level === 'entity' && field) {
        entities.sort((a, b) => {
          const av = String(a.data[field] ?? '');
          const bv = String(b.data[field] ?? '');
          return av.localeCompare(bv) * order;
        });
      }

      if (level === 'child' && field) {
        entities = entities.map(e => ({
          ...e,
          children: [...(e.children ?? [])].sort((a, b) => {
            const av = String(a.data[field] ?? '');
            const bv = String(b.data[field] ?? '');
            return av.localeCompare(bv) * order;
          }),
        }));
      }

      map.set(mod.name, entities);
    });

    return map;
  });

  // ── filteredModules — computed من rawModules + activeColFilters + search ─
  readonly filteredModules = computed<Module[]>(() => {
    const globalQuery = this.globalSearchText().trim().toLowerCase();
    const colF        = this.activeColFilters();
    // ... تطبيق الفلاتر كما هو في permissions.ts
    return this.rawModules(); // placeholder
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // بناء الأعمدة أول ما الداتا تيجي
    this.dataService.getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ modules, roles }) => {
        this.rawModules.set(modules);
        this.availableRoles.set(roles);
        this.buildColumnDefs(); // ← بعد الداتا مباشرة
      });

    // إعادة بناء الأعمدة عند تغيير اللغة
    this.t.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.buildColumnDefs());
  }

  private buildColumnDefs(): void {
    const statusOpts = buildStatusOptions(this.t);
    const actionOpts = buildActionOptions(this.t);

    // استخرج الـ categories ديناميكياً من الداتا
    const cats = new Set<string>();
    this.rawModules().forEach(m =>
      m.entities.forEach(e => {
        if (e.data['category']) cats.add(e.data['category'] as string);
      })
    );
    const catOpts = Array.from(cats).sort().map(c => ({
      label: this.t.translate(`permissionCategories.${c}`) || c,
      value: c,
    }));

    this.entityColumns.set(buildEntityColumns(this.t, catOpts, statusOpts));
    this.permColumns.set(buildPermissionColumns(this.t, statusOpts, actionOpts));
  }

  // ── Sort handler — يرفع الـ sort للـ parent signal ───────────────────────
  onSortChanged(event: TreeTableSortEvent): void {
    this.activeSort.set({
      field: event.field,
      order: event.order,
      level: event.level,
    });
  }

  // ── Column filter handler — يرفع الـ filter للـ parent signal ────────────
  onColFilterChanged(event: TreeTableColFilterEvent): void {
    const current = { ...this.activeColFilters() };
    switch (event.columnId) {
      case 'entity-name':   current.entityName   = event.text ?? null; break;
      case 'entity-status': current.entityStatus = event.opts ?? [];   break;
      case 'child-name':    current.childName    = event.text ?? null; break;
      case 'child-status':  current.childStatus  = event.opts ?? [];   break;
      case 'child-action':  current.childAction  = event.opts ?? [];   break;
    }
    this.activeColFilters.set(current);
  }
}
```

##### 3. الـ Template (`permissions.html`)

```html
<!-- التولبار ملك الـ host — مش جوه الـ tree-table -->
<app-shared-toolbar
  [title]="'permissions.title' | transloco"
  [searchValue]="globalSearchText()"
  [hasFilters]="true"
  [showBuiltInSearch]="true"
  (searchChanged)="onSearchChanged($event)"
  (clearSearch)="clearFilters()"
  (onExport)="exportToCSV()"
>
  <ng-container toolbar-filters>
    <app-filter
      [label]="'permissions.filters.module' | transloco"
      [options]="moduleFilterOptions()"
      [selected]="selectedModuleFilters()"
      (selectedChange)="updateModuleFilters($event)"
    />
    <app-filter
      [label]="'permissions.filters.entityStatus' | transloco"
      [options]="statusFilterOptions()"
      [selected]="selectedStatusFilters()"
      (selectedChange)="updateStatusFilters($event)"
    />
  </ng-container>

  <!-- Layout toggles منفصلة في الـ toolbar-extra -->
  <ng-container toolbar-extra>
    <div class="flex gap-1">
      <p-button
        size="small"
        [severity]="layoutMode() === 'grid' ? 'primary' : 'secondary'"
        icon="pi pi-th-large"
        (onClick)="layoutMode.set('grid')"
      />
      <p-button
        size="small"
        [severity]="layoutMode() === 'list' ? 'primary' : 'secondary'"
        icon="pi pi-list"
        (onClick)="layoutMode.set('list')"
      />
    </div>
  </ng-container>
</app-shared-toolbar>

<!-- Tree Table — [showToolbar]="false" لأن التولبار فوق في الـ host -->
<app-tree-table
  [modules]="filteredModules()"
  [sortedEntitiesMap]="sortedEntitiesMap()"
  [roleAssignments]="roleAssignments()"
  [expandedRows]="expandedRows"
  [selectedEntities]="selectedEntities()"
  [selectedItems]="selectedPermissions()"
  [availableRoles]="availableRoles()"
  [groupByModule]="true"
  [entityColumns]="entityColumns()"
  [childColumns]="permColumns()"
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

<!-- Bottom bar للـ bulk actions — يظهر لما يتحدد permissions -->
<app-shared-bottom-bar
  [visible]="selectedPermissions().length > 0"
  [count]="selectedPermissions().length"
  itemLabel="permission"
  [showDelete]="false"
  [actions]="[{ key: 'bulk-edit', label: 'Edit Roles', icon: 'pi pi-pencil', severity: 'secondary' }]"
  (bulkAction)="onBottomBarAction($event)"
  (clearSelection)="clearSelection()"
/>
```

---

#### Data Service Pattern — `PermissionsDataService`

لما الـ API مش بيرجع الـ envelope المعتادة `{ success, result }` وبدله يرجع شكل مختلف، override الـ `mapItem` و `getItems` أو اعمل `load()` مباشر:

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionsDataService extends BaseApiService<PermissionsJson> {

  protected override url = '/api/permissions.mock.json';
  private readonly t = inject(TranslocoService);

  // ① الـ JSON مش عليه envelope — بنرجعه as-is
  protected override mapItem(raw: PermissionsJson): PermissionsJson { return raw; }
  protected override getItems(result: PermissionsJson): PermissionsJson[] { return [result]; }

  // ② Load مباشر بدون BaseApiService envelope logic
  private load(): Observable<PermissionsJson> {
    return this.http.get<PermissionsJson>(this.url);
  }

  // ③ getData$ — بيعيد بناء الداتا المترجمة عند كل تغيير لغة
  getData$(): Observable<{ modules: Module[]; roles: Role[] }> {
    return this.t.langChanges$.pipe(
      switchMap(() => this.load()),
      map(json => ({
        modules: this.buildModules(json.modules),
        roles:   this.buildRoles(json.roles),
      })),
    );
  }

  // ④ getRoleAssignments$ — one-shot لبذر الـ roleAssignments signal
  getRoleAssignments$(): Observable<[string, string[]][]> {
    return this.load().pipe(
      map(json => json.roleAssignments.map(
        a => [a.permissionKey, a.roleIds] as [string, string[]]
      )),
    );
  }
}
```

```typescript
// في الـ component — استخدام الـ service
ngOnInit(): void {
  // ① بذر الـ roleAssignments مرة واحدة
  this.dataService.getRoleAssignments$()
    .pipe(take(1))
    .subscribe(seed => {
      this.roleAssignmentsMap = new Map(seed);
      this.roleAssignments.set(new Map(seed));
    });

  // ② subscribe للداتا المترجمة — بيتحدث مع اللغة تلقائياً
  this.dataService.getData$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ modules, roles }) => {
      this.rawModules.set(modules);
      this.availableRoles.set(roles);
      this.buildColumnDefs();
    });
}
```

---

#### Checklist — Tree Table في صفحة جديدة

```
① حدد المستويات: هل 2 مستويات (entity + children) أو 3 (+ grandchildren)?
   → 2: entityColumns + childColumns
   → 3: + grandchildColumns + grandchildLabel

② هل التولبار داخل الـ tree-table أو في الـ host؟
   → داخلي:  [showToolbar]="true"  + [toolbarFilters] + [title]
   → خارجي:  [showToolbar]="false" + ابني <app-shared-toolbar> في الـ host

③ هل عندك layout toggle؟
   → نعم: [showLayoutToggle]="true" + [layoutInput]="layoutMode()"
   → ادير الـ signal في الـ host عشان يتشارك مع التولبار الخارجي

④ هل الـ sort والـ filter يتحملوا في الـ parent؟
   → دايماً نعم — الـ tree-table بيبعت events، الـ parent يحفظهم في signals
   → sortedEntitiesMap + filteredModules = computed signals في الـ parent

⑤ هل عندك role assignments؟
   → نعم: [roleAssignments]="roleAssignments()" + [availableRoles]="availableRoles()"
   → احفظ المجموعة في Map<string, string[]> وحدّثها بـ set(new Map(...))

⑥ هل عندك bulk actions؟
   → أضف <app-shared-bottom-bar> منفصل في الـ host
   → [visible]="selectedItems().length > 0"
```

---

