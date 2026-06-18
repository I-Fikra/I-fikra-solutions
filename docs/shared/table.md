### `<app-table>` — `TableComponent`

**File:** `src/app/shared/components/table/table.ts`

Wraps `p-table` and `p-dataview` with a full toolbar, filters, column header popovers, row actions menu, bottom bar, and optional card/grid layout toggle. Pass config objects — never write markup manually.

#### Inputs

| Input | Type | Default | What it does |
|---|---|---|---|
| `title` | `string` | `'Items'` | Toolbar heading |
| `data` | `any[]` | `[]` | Dataset to display |
| `columns` | `TableColumn[]` | `[]` | Column definitions |
| `rows` | `number` | `10` | Rows per page |
| `loading` | `boolean` | `false` | Shows skeleton/spinner |
| `showToolbar` | `boolean` | `true` | Whether to render the toolbar |
| `toolbarHasFilters` | `boolean` | `true` | Shows filter row in toolbar |
| `toolbarShowAdd` | `boolean` | `true` | Shows the Add button |
| `toolbarShowBuiltInSearch` | `boolean` | `true` | Shows the search input |
| `toolbarShowClearButton` | `boolean` | `true` | Shows the clear-filters button |
| `toolbarSearchPlaceholder` | `string` | `''` | Placeholder for search input |
| `toolbarFilters` | `ToolbarFilterDefinition[]` | `[]` | Dropdown filter chips in toolbar |
| `showActions` | `boolean` | `true` | Shows the actions column |
| `showView` | `boolean` | `false` | Adds a View button per row |
| `useExternalForm` | `boolean` | `false` | Emits `onNew`/`onEdit` instead of opening built-in dialog |
| `statusOptions` | `{ label: string; value: string }[]` | `[]` | Options for status column filter |
| `severityMap` | `Record<string, SeverityType> \| null` | `null` | Maps status string → PrimeNG severity |
| `rowActions` | `((item: any) => MenuItem[]) \| null` | `null` | Per-row action menu items factory |
| `customActions` | `CustomAction[]` | `[]` | Icon-button actions per row |
| `bulkActions` | `BottomBarAction[]` | `[]` | Extra bulk actions for bottom bar |
| `showBulkDelete` | `boolean` | `true` | Shows bulk delete in bottom bar |
| `extraColMenuItems` | `((col: TableColumn) => MenuItem[]) \| null` | `null` | Extra items in column-header popover |
| `showLayoutToggle` | `boolean` | `false` | Shows Cards/Table toggle buttons |
| `cardGridCols` | `string` | `'grid-cols-12'` | Tailwind grid class for card grid |
| `cardColSpan` | `string` | `'col-span-12 sm:col-span-6 lg:col-span-4'` | Tailwind col-span per card |

#### Outputs

| Output | Payload | When fired |
|---|---|---|
| `save` | `any` | Built-in inline save clicked |
| `delete` | `any` | Single-row delete confirmed |
| `bulkDelete` | `any[]` | Bulk delete confirmed from bottom bar |
| `selectionChange` | `any[]` | Checkbox selection changes |
| `onView` | `any` | View button clicked |
| `onNew` | `void` | Add button clicked (when `useExternalForm = true`) |
| `onEdit` | `any` | Edit clicked on a row (when `useExternalForm = true`) |
| `customAction` | `{ key: string; item: any }` | Custom icon-button clicked |
| `bulkAction` | `string` | Bulk action key from bottom bar |

#### Content Projection

| Slot | Purpose |
|---|---|
| `#cardTemplate` | Custom card rendered in grid/cards view. Receives `let-item` |

#### `TableColumn` Shape

```typescript
export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'numeric' | 'date' | 'boolean' | 'status' | 'currency' | 'rating' | 'time';
  sortable?: boolean;       // default: true
  filterable?: boolean;     // default: true
  filterOptions?: { label: string; value: string }[];  // enables multi-select in header popover
  filterPlaceholder?: string;
  minWidth?: string;        // e.g. '10rem'
  width?: string;
  icon?: string;            // PrimeNG icon class shown before text value
  subField?: string;        // secondary text shown below the main value
  exportable?: boolean;
  exportHeader?: string;
}
```


#### `ToolbarFilterDefinition` Shape

```typescript
export interface ToolbarFilterDefinition {
  field: string;
  label: string;
  options: { label: string; value: string }[];
  matchMode?: 'in' | 'equals' | 'contains';  // default: 'in'
}
```

#### Minimal Usage

```html
<app-table
  [title]="'roles.pageTitle' | transloco"
  [data]="roles"
  [columns]="tableColumns"
  [loading]="loading"
  [rowActions]="rowActionsFactory"
  [toolbarFilters]="toolbarFilters"
  [toolbarShowAdd]="true"
  [useExternalForm]="true"
  (onNew)="openCreateDialog()"
/>
```

#### With Cards/Grid View

To enable the layout toggle and custom card template:

```html
<app-table
  [showLayoutToggle]="true"
  [useExternalForm]="true"
  ...
>
  <ng-template #cardTemplate let-item>
    <div class="bg-surface-0 dark:bg-surface-900 rounded-md p-6">
      <p>{{ item.name }}</p>
      <p-tag [value]="item.status" [severity]="item.status | severity" />
    </div>
  </ng-template>
</app-table>
```

> `#cardTemplate` is picked up via `@ContentChild('cardTemplate')` in the component. The table automatically switches to `p-dataview` when layout is `'grid'`, keeping filters and search in sync.

#### Row Actions (always arrow functions)

```typescript
// ✅ Arrow function — preserves `this` inside MenuItem commands
rowActionsFactory = (item: MyEntity): MenuItem[] => [
  {
    label: this.t.translate('actions.view') || 'View',
    icon: 'pi pi-eye',
    routerLink: ['/my-module/details']
  },
  {
    label: this.t.translate('actions.edit') || 'Edit',
    icon: 'pi pi-pencil',
    command: () => this.openEditDialog(item)
  },
  { separator: true },
  {
    label: this.t.translate('actions.delete') || 'Delete',
    icon: 'pi pi-trash',
    styleClass: 'text-red-500',
    command: () => this.confirmDelete(item)
  }
];
```