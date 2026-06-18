# TableBuilderService — Developer Guide

A shared Angular service that turns any raw API/JSON response into a fully configured
dynamic table: typed columns, smart ordering, primary name detection, and a page title —
with zero hardcoded field names.

Located at: `src/app/shared/services/table-builder.service.ts`

---

## What It Does

| Feature | Details |
|---|---|
| **Two column modes** | Infer columns from item keys, OR read them from a `meta_data` array |
| **Primary field** | Detects the "name" column by keyword hints; always rendered first |
| **Status second** | Status columns are always ordered after the name |
| **Type detection** | Automatically assigns `status`, `numeric`, `date`, or `text` per key |
| **Visibility control** | In meta_data mode, hides columns where `is_public <= 0` |
| **Excluded fields** | `id`, `description`, audit fields, etc. are hidden by default (key-inference mode) |
| **Page title** | Extracted from any configurable dot-path in the response |
| **Per-call overrides** | Every default can be extended or overridden per service |

---

## Two Modes

### Mode 1 — Key Inference *(default)*
Columns are derived automatically from the keys of the first item in the response.
Use this when the API does not return column metadata.

### Mode 2 — Meta Data *(when `metaDataPath` is provided)*
Columns are built from a dedicated metadata array in the response.
Each entry defines the field code, display name, type, order, and visibility.
Use this when the API explicitly describes its own columns.

```json
{
  "result": {
    "meta_data": [
      {
        "secondary_code": "vessel_name",
        "name": "الاسم",
        "order": 2,
        "type": "STRING",
        "is_public": 1
      },
      {
        "secondary_code": "vessel_id",
        "name": "رقم",
        "order": 1,
        "type": "NUMBER",
        "is_public": -1
      }
    ],
    "items": [ ... ]
  }
}
```

- `secondary_code` → `column.field` (must match the key name in each item object)
- `name` → `column.header` (the display label shown in the table)
- `order` → columns are sorted by this value
- `type` → `STRING` → `text`, `NUMBER` → `numeric`, `DATE` → `date`, `STATUS` → `status`
- `is_public` → any value `<= 0` hides the column entirely

---

## Basic Usage

### Step 1 — Inject the service in your feature service

```ts
import { TableBuilderService, TableResponse } from '@/app/foundation/shared/services/table-builder.service';

@Injectable({ providedIn: 'root' })
export class MyFeatureService {
    private readonly http         = inject(HttpClient);
    private readonly tableBuilder = inject(TableBuilderService);

    // Mode 1 — key inference (no metaDataPath)
    getAll(): Observable<TableResponse> {
        return this.http.get<any>('my-data.json').pipe(
            map(res => this.tableBuilder.build(res, {
                itemsPath: 'result.items',
                titlePath: 'result.pageTitle',
            }))
        );
    }
}
```

```ts
// Mode 2 — meta_data driven (provide metaDataPath)
getAll(): Observable<TableResponse> {
    return this.http.get<any>('api/vessels.json').pipe(
        map(res => this.tableBuilder.build(res, {
            itemsPath:    'result.items',
            titlePath:    'result.paging.page_title',
            metaDataPath: 'result.meta_data',        // ← enables Mode 2
        }))
    );
}
```

### Step 2 — Consume in the component

```ts
export class MyPage implements OnInit, OnDestroy {
    items: any[]               = [];
    tableColumns: TableColumn[] = [];
    pageTitle                  = '';
    loading                    = false;

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.loading = true;
        this.myService.getAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ items, columns, pageTitle }) => {
                    this.items        = [...items];
                    this.tableColumns = columns;
                    this.pageTitle    = pageTitle;
                    this.loading      = false;
                    this.cdr.markForCheck(); // if component uses OnPush
                },
                error: () => {
                    this.loading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

### Step 3 — Bind in the template

```html
<app-table
    [title]="pageTitle"
    [data]="items"
    [columns]="tableColumns"
    [loading]="loading"
/>
```

> **Important:** do NOT pipe `pageTitle` through `| transloco`.
> It is already a translated string coming directly from the API.

---

## Config Options

All fields are optional.

```ts
this.tableBuilder.build(res, {
    itemsPath:     'result.items',          // dot-path to the items array
    titlePath:     'result.paging.page_title', // dot-path to the page title string
    metaDataPath:  'result.meta_data',      // enables Mode 2 (meta_data driven)
    excludedKeys:  ['MEDIA_IMAGE'],         // extra keys to hide (Mode 1 only)
    columnTypeMap: { AMOUNT: 'numeric' },   // extra type overrides (both modes)
    nameHints:     ['designation'],         // extra primary-field hints (both modes)
});
```

### `itemsPath`
Dot-notation path to the array of items.

| Response shape | Value |
|---|---|
| `{ results: [...] }` | `'results'` *(default)* |
| `{ result: { items: [...] } }` | `'result.items'` |
| `{ data: { list: [...] } }` | `'data.list'` |

### `titlePath`
Dot-notation path to the page title string.

| Response shape | Value |
|---|---|
| `{ pageTitle: "..." }` | `'pageTitle'` *(default)* |
| `{ result: { pageTitle: "..." } }` | `'result.pageTitle'` |
| `{ result: { paging: { page_title: "..." } } }` | `'result.paging.page_title'` |

### `metaDataPath`
Dot-notation path to the metadata array. When provided, switches to Mode 2.
When omitted, Mode 1 (key inference) is used.

### `excludedKeys` *(Mode 1 only)*
Extra keys to hide from the table, on top of the defaults.
You never need to re-list the defaults.

```ts
excludedKeys: ['MEDIA_IMAGE', 'INTERNAL_REF']
```

### `columnTypeMap`
Override the detected type for specific keys. Works in both modes.

```ts
columnTypeMap: {
    VESSEL_COUNT:    'numeric',
    APPROVAL_STATUS: 'status',
}
```

### `nameHints`
Extra substrings that identify the primary "name" column. Case-insensitive. Works in both modes.
Built-in hints: `name`, `اسم`, `title`, `عنوان`, `label`, `تسمية`.

```ts
nameHints: ['designation', 'مسمى']
```

---

## Default Excluded Keys *(Mode 1 only)*

These are always hidden automatically:

```
id,          المعرف
description, الوصف
created_at,  تاريخ_الإنشاء
created_by,  تم_الإنشاء_بواسطة
updated_at,  تاريخ_التحديث
updated_by,  تم_التحديث_بواسطة
code,        الرمز
```

---

## Default Type Detection *(Mode 1)*

| Key matches | Detected type |
|---|---|
| `status`, `الحالة`, `active`, `مفعل` | `status` |
| `user_count`, `permission_count`, `عدد_*`, `count`, `total`, `amount` | `numeric` |
| `created_at`, `updated_at`, `تاريخ_*` | `date` |
| anything else | `text` |

## Meta Data Type Mapping *(Mode 2)*

| `type` field in meta_data | TableColumn type |
|---|---|
| `STRING` | `text` |
| `NUMBER` | `numeric` |
| `DATE` | `date` |
| `STATUS` | `status` |

Additionally, any column whose `secondary_code` contains `status` or `حالة` is treated as `status` type regardless of the `type` field.

---

## Column Ordering Rules

Columns are rendered in the exact order defined by the `order` field
in the `meta_data` array. The API is the single source of truth for order.

The `isPrimary` and `isStatus` flags are still set on each column
and are used by the card/grid template to style the name and status
differently — but they do not affect column position in the table.

---

## Language-Aware Services

If your API returns different files per language (EN/AR), combine with `TranslocoService`.
The subscription in the component automatically re-fires on every language switch:

```ts
@Injectable({ providedIn: 'root' })
export class RoleService {
    private readonly http         = inject(HttpClient);
    private readonly t            = inject(TranslocoService);
    private readonly tableBuilder = inject(TableBuilderService);

    getAll(): Observable<TableResponse> {
        return this.t.langChanges$.pipe(
            switchMap(lang => {
                const file = lang === 'ar'
                    ? 'api/roles-list-ar.json'
                    : 'api/roles-list-en.json';
                return this.http.get<any>(file);
            }),
            map(res => this.tableBuilder.build(res, {
                itemsPath: 'result.items',
                titlePath: 'result.pageTitle',
            }))
        );
    }
}
```

In the component, `takeUntil(destroy$)` keeps the subscription alive across language switches:

```ts
this.myService.getAll()
    .pipe(takeUntil(this.destroy$))   // stays alive, re-fires on lang change
    .subscribe(({ items, columns, pageTitle }) => {
        this.items        = [...items];
        this.tableColumns = columns;
        this.pageTitle    = pageTitle;
        this.cdr.markForCheck();
    });
```

---

## Card / Grid View

Use `isPrimary` and `isStatus` flags on each column to structure the card layout:

```html
<ng-template #cardTemplate let-item>
    <div class="bg-surface-0 dark:bg-surface-900 rounded-md p-6 flex flex-col gap-2">

        <!-- 1. Primary name — always first, large and bold -->
        <ng-container *ngFor="let col of tableColumns">
            <p *ngIf="col.isPrimary" class="text-xl font-bold mb-2">
                {{ item[col.field] }}
            </p>
        </ng-container>

        <!-- 2. All other fields except primary and status -->
        <ng-container *ngFor="let col of tableColumns">
            <div
                *ngIf="!col.isPrimary && !col.isStatus"
                class="flex justify-between text-sm py-1 border-b border-surface-100 dark:border-surface-700"
            >
                <span class="text-surface-500 dark:text-surface-400">{{ col.header }}</span>
                <span class="font-semibold">{{ item[col.field] }}</span>
            </div>
        </ng-container>

        <!-- 3. Last row: status tag + actions button -->
        <div class="flex justify-between items-center mt-4">
            <ng-container *ngFor="let col of tableColumns">
                <p-tag
                    *ngIf="col.isStatus"
                    [value]="item[col.field]"
                    [severity]="item[col.field] | severity"
                />
            </ng-container>
            <p-button
                icon="pi pi-ellipsis-v"
                severity="secondary"
                [outlined]="true"
                (click)="openCardMenu($event, item)"
            />
        </div>

    </div>
</ng-template>
```

---

## Quick Reference

```ts
// Minimal — flat array at results key
map(res => this.tableBuilder.build(res))

// Nested array, no metadata
map(res => this.tableBuilder.build(res, {
    itemsPath: 'result.items',
    titlePath: 'result.pageTitle',
}))

// Meta_data driven (Mode 2) — vessels / ships style response
map(res => this.tableBuilder.build(res, {
    itemsPath:    'result.items',
    titlePath:    'result.paging.page_title',
    metaDataPath: 'result.meta_data',
}))

// Language-aware with extra overrides
map(res => this.tableBuilder.build(res, {
    itemsPath:     'result.items',
    titlePath:     'result.pageTitle',
    excludedKeys:  ['INTERNAL_ID', 'RAW_PAYLOAD'],
    columnTypeMap: { VESSEL_COUNT: 'numeric', APPROVAL: 'status' },
    nameHints:     ['designation', 'مسمى'],
}))
```

---

## TableResponse Shape

Every call to `build()` returns:

```ts
interface TableResponse<T = any> {
    items:     T[];            // the raw item array from the response
    columns:   TableColumn[];  // ready-to-use columns for <app-table>
    pageTitle: string;         // the page title from the response
}
```

Bind directly — no transformation needed in the component.