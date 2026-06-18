# FilterComponent (`app-filter`)

A Jira-style inline filter button with a searchable multi-select dropdown. Implements `ControlValueAccessor` so it works with both `[(ngModel)]` and reactive forms.

---

## Basic usage

The most common pattern — bind to `toolbarFilterValues[f.field]` and call `onToolbarFilterChange()` on every change, exactly as the shared toolbar does internally:

```html
<app-filter
  label="Status"
  [options]="statusOptions"
  [(ngModel)]="selectedStatuses"
  (ngModelChange)="onFilterChange()"
/>
```

---

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `''` | Text shown on the trigger button before any selection. |
| `options` | `JiraFilterOption[]` | `[]` | The list of selectable items (see shape below). |
| `selected` | `string[]` | `[]` | Standalone two-way binding — use `[(selected)]` if not using `ngModel`. |
| `showOperator` | `boolean` | `false` | Adds an operator row (=, ≠, ~) above the options list. |
| `operator` | `JiraFilterOperator` | `'equals'` | Active operator value when `showOperator` is true. |
| `maxLabels` | `number` | `1` | How many selected labels to show inline before collapsing to `First +N`. |
| `showClear` | `boolean` | `true` | Shows the × clear button on the trigger when a selection exists. |
| `disabled` | `boolean` | `false` | Disables the trigger and all interactions. |

## Outputs

| Output | Type | Description |
|---|---|---|
| `selectedChange` | `EventEmitter<string[]>` | Emits the new selection array on every toggle. Pair with `[(selected)]`. |
| `operatorChange` | `EventEmitter<JiraFilterOperator>` | Emits when the operator is changed. Only fires when `showOperator` is true. |

---

## Option shape

```typescript
interface JiraFilterOption {
  label: string;   // Display text
  value: string;   // The value stored in the selection array
  color?: string;  // Optional color dot (e.g. '#22c55e')
  icon?:  string;  // Optional PrimeIcons class (e.g. 'pi pi-user') — used when color is absent
}
```

---

## Ways to bind

### 1. `[(ngModel)]` — most common, matches how `app-table` uses it

```html
<app-filter
  label="Status"
  [options]="statusOptions"
  [(ngModel)]="selectedStatuses"
  (ngModelChange)="applyFilters()"
/>
```

```typescript
statusOptions: JiraFilterOption[] = [
  { label: 'Active',   value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];
selectedStatuses: string[] = [];
```

### 2. `[(selected)]` — standalone two-way binding without a form

```html
<app-filter
  label="Category"
  [options]="categoryOptions"
  [(selected)]="selectedCategories"
  (selectedChange)="applyFilters()"
/>
```

### 3. Inside `toolbarFilters` with `app-table`

You don't use `app-filter` directly here — just pass `toolbarFilters` to the table and it renders the filters internally:

```typescript
this.toolbarFilters = [
  {
    field: 'STATUS_CODE',
    label: 'Status',
    options: [
      { label: 'Active',   value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
    ],
    matchMode: 'in'
  },
  {
    field: 'CATEGORY_CODE',
    label: 'Category',
    options: this.categoryOptions,
    matchMode: 'in'
  }
];
```

```html
<app-table
  [data]="items"
  [columns]="columns"
  [toolbarHasFilters]="true"
  [toolbarFilters]="toolbarFilters"
/>
```

---

## Operator mode

Enable the operator row to let users switch between equals / not-equals / contains:

```html
<app-filter
  label="Name"
  [options]="nameOptions"
  [(ngModel)]="selectedNames"
  [showOperator]="true"
  [(operator)]="nameOperator"
  (operatorChange)="applyFilters()"
/>
```

```typescript
nameOperator: JiraFilterOperator = 'equals'; // 'equals' | 'not_equals' | 'contains'
```

> Note: the operator value is your responsibility to act on — the component emits it but does not apply it to the data automatically.

---

## Color dots and icons

```typescript
statusOptions: JiraFilterOption[] = [
  { label: 'Active',   value: 'ACTIVE',   color: '#22c55e' },
  { label: 'Pending',  value: 'PENDING',  color: '#f59e0b' },
  { label: 'Inactive', value: 'INACTIVE', color: '#ef4444' },
];

roleOptions: JiraFilterOption[] = [
  { label: 'Admin',  value: 'ADMIN',  icon: 'pi pi-shield' },
  { label: 'Editor', value: 'EDITOR', icon: 'pi pi-pencil' },
];
```

`color` takes priority — if both are provided, the dot is shown and the icon is ignored.

---

## Multi-label display

By default only the first selected label shows inline, with the rest collapsed:

```
Status = Active +2
```

To show up to 3 labels before collapsing:

```html
<app-filter label="Status" [options]="opts" [(ngModel)]="sel" [maxLabels]="3" />
```

---

## Programmatic control

The component exposes two public methods you can call via a `@ViewChild` reference:

```typescript
@ViewChild(FilterComponent) filterRef!: FilterComponent;

// Close the dropdown without clearing the selection
this.filterRef.close();

// Clear all selections and close
this.filterRef.clearAll(new MouseEvent('click'));
```

---

## Keyboard & accessibility

- `Escape` closes the dropdown from anywhere on the page.
- Clicking outside the component closes the dropdown.
- The dropdown panel has `role="listbox"` and `aria-multiselectable="true"`.
- Each option has `role="option"` and `aria-selected`.
- The clear button has an `aria-label` from the translation key `shared.filter.clearFilter`.

---

## Required translation keys

| Key | Usage |
|---|---|
| `shared.filter.clearFilter` | Aria-label on the trigger's clear (×) button |
| `shared.filter.optionsFor` | Aria-label on the dropdown panel (`{ label }`) |
| `shared.filter.searchFor` | Placeholder on the search input (`{ label }`) |
| `shared.filter.noResultsFor` | Empty state message (`{ query }`) |
| `shared.bottomBar.selectedSuffix` | "selected" text in the footer count |
| `shared.bottomBar.clearSelection` | "Clear" button label in the footer |