### `<app-shared-toolbar>` — `SharedToolbarComponent`

**File:** `src/app/shared/components/toolbar/shared-toolbar.component.ts`

Standard page header. Renders title, Add button, 3-dot options menu (Export/Import), search input, and filter chips. **Never inline a toolbar manually.**

#### Inputs

| Input               | Type           | Default       | What it does               |
| ------------------- | -------------- | ------------- | -------------------------- |
| `title`             | `string`       | `''`          | Page heading               |
| `searchValue`       | `string`       | `''`          | Current search string      |
| `searchPlaceholder` | `string`       | `'Search...'` | Input placeholder          |
| `showClearButton`   | `boolean`      | `true`        | Shows clear-filters button |
| `showBuiltInSearch` | `boolean`      | `true`        | Shows the search input     |
| `hasFilters`        | `boolean`      | `false`       | Shows filter row (Row 2)   |
| `showAdd`           | `boolean`      | `false`       | Shows the Add button       |
| `currentLang`       | `'en' \| 'ar'` | `'en'`        | Drives RTL/LTR             |

#### Outputs

| Output              | Payload  | When fired                 |
| ------------------- | -------- | -------------------------- |
| `searchValueChange` | `string` | Supports `[(searchValue)]` |
| `searchChanged`     | `string` | Every keystroke + Enter    |
| `clearSearch`       | `void`   | Clear button clicked       |
| `addClicked`        | `void`   | Add button clicked         |
| `onExport`          | `void`   | Export from 3-dot menu     |
| `onImport`          | `void`   | Import from 3-dot menu     |

#### Content Projection Slots

| Slot                     | Purpose                              |
| ------------------------ | ------------------------------------ |
| `[toolbar-row-actions]`  | Extra buttons next to Add            |
| `[toolbar-filters]`      | Filter dropdowns/chips in filter row |
| `[toolbar-extra]`        | Right-aligned content in filter row  |
| `[toolbar-filter-chips]` | Active filter chips row              |

> **Note:** When you use `<app-table>`, the toolbar is already composed internally — you don't need to add `<app-shared-toolbar>` separately unless you're building a custom page without `<app-table>`.
