### `<app-shared-bottom-bar>` — `SharedBottomBarComponent

**File:** `src/app/shared/components/bottom-bar/shared-bottombar.component.ts`

Floating bottom action bar that slides up when rows are selected. Built into `<app-table>` — only use this standalone for custom pages.

#### Inputs

| Input | Type | Default | What it does |
|---|---|---|---|
| `visible` | `boolean` | `false` | Controls visibility |
| `count` | `number` | `0` | Number of selected items |
| `itemLabel` | `string` | `'item'` | Singular label |
| `itemLabelPlural` | `string` | `itemLabel + 's'` | Plural label |
| `showDelete` | `boolean` | `true` | Shows built-in Delete button |
| `actions` | `BottomBarAction[]` | `[]` | Custom action buttons |

#### `BottomBarAction` Shape

```typescript
export interface BottomBarAction {
  key: string;
  label: string;
  icon: string;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  tooltip?: string;
  destructive?: boolean; // shows confirm dialog before emitting
}
```