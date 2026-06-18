# Metadata Page — `app-tree-table` Usage

This page renders its content using the shared `TreeTableComponent`
(`@/app/foundation/shared/components/tree-table/tree-table`).

## Files

- `metadata.ts` — defines `entityColumns` and the `modules` signal (initialized from `user-attributes.data.ts`)
- `metadata.html` — renders `<app-tree-table>`
- `metadata.scss` — empty (styling is done via Tailwind utility classes per project convention)
- `user-attributes.data.ts` — `TreeModule[]` data describing the `user` entity's attributes, grouped by `feature` (System Identifiers, Identity, Contact Info, Security & Authentication, Life Cycle, Personal Info, Media, Settings & Preferences, Classification, Multitenancy, Audit)

## Data shape

```ts
TreeModule[]
  └─ name: string
  └─ entities: TreeNode[]
       └─ key: string            // unique id, e.g. 'user.email'
       └─ data: TreeNodeData      // row fields (must include `name`)
       └─ children?: TreeNode[]   // shown in the nested table when expanded
```

`user-attributes.data.ts` exports `USER_ATTRIBUTE_MODULES`, one module per attribute `feature`, each with a flat list of attribute entities (no nesting):

```ts
export const USER_ATTRIBUTE_MODULES: TreeModule[] = [
  {
    name: 'System Identifiers',
    entities: [
      { key: 'user.id',   data: { name: 'ID',   code: 'id',   type: 'number', required: 'Required', nullable: 'No' } },
      { key: 'user.code', data: { name: 'Code', code: 'code', type: 'string', required: 'Required', nullable: 'No' } },
    ],
  },
  // ...
];
```

It was generated from a YAML attribute spec (`code`, `feature`, `type`, `isNullable`, `occurs.required`, `localization.name.en`, etc.) — see the project for the original source if the attribute set changes.

## Columns

`entityColumns` describe each attribute row:

- `name` (text, sortable/filterable) — localized attribute name
- `code` (code) — raw attribute code
- `type` (tag, `severityMap` per data type) — `string` / `number` / `boolean` / `datetime` / `date` / `text` / `json`
- `required` (tag, `severityMap`) — `Required` / `Optional`
- `nullable` (tag, `severityMap`) — `Yes` / `No`

`cellType` controls how a column renders: `'tag'`, `'code'`, `'roles'`, `'org-name'`, or default text.

## Template

```html
<app-tree-table
  [modules]="modules()"
  [entityColumns]="entityColumns"
  [groupByModule]="true"
  title="User Attributes"
/>
```

- `[groupByModule]="true"` — shows the module name (feature group) as a heading above its entities
- `[showToolbar]="true"` (default) — built-in search bar + title; pass `false` to use your own `<app-shared-toolbar>` in the host page

## Replacing the static data with a real API

1. Inject a data service that returns `TreeModule[]` (or maps your API response into that shape)
2. Replace the `modules = signal<TreeModule[]>(USER_ATTRIBUTE_MODULES)` initializer with `signal<TreeModule[]>([])`
3. Populate it in `ngOnInit` (implement `OnInit`):

```ts
ngOnInit(): void {
  this.metadataService.getAttributes$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(modules => this.modules.set(modules));
}
```

## Optional features (not wired up yet)

- **Sorting / column filters** — listen to `(sortChanged)` / `(colFilterChanged)` and recompute `modules` (or a `sortedEntitiesMap` signal) accordingly
- **Selection / bulk actions** — bind `[selectedEntities]` / `[selectedItems]`, listen to `(entitySelectionChange)` / `(itemSelectionChange)`, and add `<app-shared-bottom-bar>`
- **Cards/grid view** — set `[showLayoutToggle]="true"` + `[layoutInput]="layoutMode()"`, optionally with a custom `<ng-template #cardTemplate let-entity>`
- **Custom row actions** — project `<ng-template #entityRowExtra>` / `#childRowExtra` / `#grandchildRowExtra`, or handle `(entityEdit)`, `(entityDelete)`, `(itemEdit)`, `(itemDelete)`

## Full reference

See [`docs/shared/tree-table.md`](../../../../../../../../docs/shared/tree-table.md) for the complete API
(all inputs/outputs, `TreeTableColFilterEvent`, `TreeTableSortEvent`, and a full
worked example based on the Permissions page).
