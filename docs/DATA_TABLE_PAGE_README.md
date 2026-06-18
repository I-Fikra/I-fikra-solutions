# DataTablePage — Usage Guide

`<app-data-table-page>` is a generic, reusable full-page table component.  
Drop it into any page component, hand it a `DataTablePageConfig`, and you get a complete table with CRUD dialogs, export/import, search, filters, and language switching — all wired up automatically.

---

## Quick Start

```ts
// my-page.component.ts
import { Component } from '@angular/core';
import { DataTablePageComponent } from '@/app/foundation/shared/components/data-table-page/generic-table-page.component';
import { DataTablePageConfig } from '@/app/foundation/shared/components/data-table-page/generic-table-page.config';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [DataTablePageComponent],
  template: `<app-data-table-page [config]="config" />`,
})
export class MyPageComponent {
  config: DataTablePageConfig = {
    apiUrl:   'http://your-api/api/your-entity',
    idField:  'id',
    actions:  { create: true, edit: true, view: true, delete: true },
  };
}
```

That's all you need for a fully working page.

---

## Config Reference (`DataTablePageConfig`)

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `apiUrl` | `string` | ✅ | — | Main API endpoint (GET all / POST / PUT / DELETE) |
| `idField` | `string` | ✅ | `'id'` | The field used to uniquely identify each row |
| `fallbackJsonAr` | `string` | — | — | Local JSON path used while the API loads (Arabic) |
| `fallbackJsonEn` | `string` | — | — | Local JSON path used while the API loads (English) |
| `actions` | `DataTableActions` | — | all `true` | Which CRUD actions to show |
| `extraRowActions` | `ExtraRowAction[]` | — | `[]` | Extra items added to each row's action menu |
| `excludedKeys` | `string[]` | — | `[]` | Fields to hide from the table and forms |
| `columnTypeMap` | `Record<string, type>` | — | `{}` | Force a column's display type (`text`, `numeric`, `date`, `status`) |
| `subFieldMap` | `Record<string, string>` | — | `{}` | Show a secondary field as hover-text under a column's value |
| `itemsPath` | `string` | — | `'result.items'` | Dot-path to the items array in the API response |
| `metaPath` | `string` | — | `'result.meta_data'` | Dot-path to the column metadata in the API response |
| `titlePath` | `string` | — | `'result.paging.page_title'` | Dot-path to the page title in the API response |
| `reloadOnLangChange` | `boolean` | — | `true` | Re-fetch data when the user switches language |

### `DataTableActions`

```ts
{
  create?: boolean;  // Show "Add" button + Create dialog
  edit?:   boolean;  // Show "Edit" in row menu
  view?:   boolean;  // Show "View" in row menu
  delete?: boolean;  // Show "Delete" in row menu
}
```

---

## Fallback JSON (Offline / Fast Load)

If the API might be slow or unavailable, provide local JSON files as a fallback. The component will instantly render the local data, then silently replace it with the real API data when it arrives.

```ts
config: DataTablePageConfig = {
  apiUrl:         'http://your-api/api/visits',
  fallbackJsonAr: 'api/visits-ar.json',
  fallbackJsonEn: 'api/visits-en.json',
  idField:        'id',
};
```

The correct file is chosen automatically based on the active language.  
If the API call fails, the local JSON stays displayed — no error screen.

---

## Adding Extra Row Actions

Use `extraRowActions` to add custom items to each row's dropdown menu.  
These appear **between** the built-in View action and the Edit/Delete actions.

```ts
extraRowActions: [
  {
    labelKey: 'actions.messages',   // translation key
    icon:     'pi pi-comments',
    command:  (item) => this.router.navigate(['/messages'], {
      queryParams: { visitId: item['id'] },
    }),
  },
  { separator: true },              // visual divider line
  {
    labelKey:   'actions.invoice',
    icon:       'pi pi-file',
    routerLink: ['/invoices'],      // static router link (no item data)
  },
]
```

| Property | Type | Description |
|---|---|---|
| `labelKey` | `string` | i18n translation key for the menu label |
| `icon` | `string` | PrimeIcons class (e.g. `'pi pi-eye'`) |
| `command` | `(item) => void` | Callback — receives the row's data object |
| `routerLink` | `any[]` | Static Angular router link |
| `separator` | `boolean` | If `true`, renders a divider line (all other props ignored) |

---

## Custom View Dialog (Override)

By default, clicking "View" opens a built-in read-only dialog.  
If you need a custom view (a sidebar, a separate route, a richer panel), listen to the `(viewItem)` output — the built-in dialog is automatically suppressed.

```ts
// my-page.component.ts
readonly detailsVisible = signal(false);
readonly selectedItem   = signal<MyModel | null>(null);

onViewItem(item: any): void {
  this.selectedItem.set(item as MyModel);
  this.detailsVisible.set(true);
}
```

```html
<!-- my-page.component.html -->
<app-data-table-page
  [config]="config"
  (viewItem)="onViewItem($event)"
/>

<app-my-custom-details
  [item]="selectedItem()"
  [visible]="detailsVisible()"
  (visibleChange)="detailsVisible.set($event)"
/>
```

If **no parent** listens to `(viewItem)`, the built-in dialog is used automatically — nothing extra needed.

---

## Hiding Columns & Form Fields

Use `excludedKeys` to remove fields from both the table columns and the create/edit forms.

```ts
config: DataTablePageConfig = {
  apiUrl:       'http://your-api/api/orders',
  idField:      'id',
  excludedKeys: ['internalNotes', 'createdBy', 'legacyCode'],
};
```

---

## Forcing Column Types

The API's `meta_data` drives column types automatically, but you can override any column:

```ts
columnTypeMap: {
  arrivalDate: 'date',
  portCode:    'text',
  totalWeight: 'numeric',
  status:      'status',
}
```

Valid types: `'text'` | `'numeric'` | `'date'` | `'status'`

---

## Sub-Field Hover Text

Show a secondary value as hover text under a column's main value.  
Useful for showing a code under a name, or a connector under a sender.

```ts
subFieldMap: {
  sender:   'senderConnector',   // hover on "sender" column shows senderConnector value
  receiver: 'receiverConnector',
}
```

> **Note:** Date columns automatically show the time portion as hover text — no configuration needed.

---

## Export & Import

These are built into the toolbar automatically — no extra config needed.

| Button | Behaviour |
|---|---|
| **Export CSV** | Downloads all visible rows as a `.csv` file |
| **Export PDF** | Opens a print-ready HTML page and triggers the browser print dialog |
| **Download Template** | Downloads an `.xlsx` file with column headers and example rows. Enum columns include dropdown validation. |
| **Import** | Accepts `.csv`, `.xlsx`, or `.xls`. Matches columns by header name or field code. |

---

## Custom API Response Paths

If your API wraps data differently from the default, override the paths:

```ts
config: DataTablePageConfig = {
  apiUrl:    'http://your-api/api/shipments',
  idField:   'shipmentId',
  itemsPath: 'data.records',      // default: 'result.items'
  metaPath:  'data.columns',      // default: 'result.meta_data'
  titlePath: 'data.title',        // default: 'result.paging.page_title'
};
```

---

## Language Reload

The component re-fetches data automatically when the user switches language.  
To disable this (e.g. if your API is language-agnostic and re-fetching is wasteful):

```ts
reloadOnLangChange: false,
```

---

## Real-World Example — Visits Page

```ts
// visits.component.ts
config: DataTablePageConfig = {
  apiUrl:         'http://192.168.1.39:5000/api/port-activity/Visits',
  fallbackJsonAr: 'api/visits-ar.json',
  fallbackJsonEn: 'api/visits-en.json',
  idField:        'id',
  actions:        { create: true, edit: true, view: true, delete: true },
  extraRowActions: [
    {
      labelKey: 'actions.messages',
      icon:     'pi pi-comments',
      command:  (visit) => this.router.navigate(['/msg/messages'], {
        queryParams: {
          visitId:      visit['id'],
          internalCode: visit['internalCode'],
        },
      }),
    },
  ],
};
```

The "View" action is overridden with a custom sidebar:

```html
<app-data-table-page
  [config]="config"
  (viewItem)="onViewItem($event)"
/>

<app-visit-details
  [visit]="selectedVisit()"
  [visible]="detailsVisible()"
  (visibleChange)="detailsVisible.set($event)"
/>
```

---

## Component API Summary

| | Name | Type | Description |
|---|---|---|---|
| **Input** | `config` | `DataTablePageConfig` | Required. All configuration for the table. |
| **Output** | `viewItem` | `EventEmitter<any>` | Emits the row object when "View" is clicked. Suppresses the built-in dialog when observed. |

---

## Notes & Gotchas

- **CRUD is local-only for now** — create, edit, and delete update the in-memory list. API write calls are marked `// TODO: API call` in the component and need to be wired up.
- **`idField` must match** the actual property name returned by the API, otherwise row actions and delete will not work correctly.
- **Form fields are built from `meta_data`** returned by the API. Fields with `is_public = 0` are hidden. If your API does not return `meta_data`, the create/edit forms will be empty.
- **Lookup fields** — if a `meta_data` column has a `lookup` URL, the component fetches it automatically and populates the dropdown. No extra config needed.
- **Enum dropdowns** in the import template only work when the column's `meta_data` includes an `enum` array.
