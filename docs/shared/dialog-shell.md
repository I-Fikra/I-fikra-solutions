### `<app-shared-toolbar>` — `SharedToolbarComponent`

**File:** `src/app/shared/components/dialog-shell/dialog-shell.ts`

Wraps `p-dialog` with a standardized header, footer (Cancel + Save), and content slot. **Never use raw `p-dialog` directly.**

#### Inputs

| Input             | Type                     | Default                                | What it does                       |
| ----------------- | ------------------------ | -------------------------------------- | ---------------------------------- |
| `visible`         | `boolean`                | `false`                                | Controls open/close                |
| `header`          | `string`                 | `''`                                   | Dialog title bar text              |
| `saveDisabled`    | `boolean`                | `false`                                | Disables the Save button           |
| `hideFooter`      | `boolean`                | `false`                                | Hides footer entirely              |
| `styleClass`      | `string`                 | `''`                                   | Extra CSS classes                  |
| `style`           | `Record<string, string>` | `{ width: '450px' }`                   | Inline style                       |
| `showHeader`      | `boolean`                | `true`                                 | Shows/hides header bar             |
| `closable`        | `boolean`                | `true`                                 | Shows the × close button           |
| `dismissableMask` | `boolean`                | `true`                                 | Clicking outside closes the dialog |
| `draggable`       | `boolean`                | `false`                                | Allows dragging                    |
| `resizable`       | `boolean`                | `false`                                | Allows resizing                    |
| `blockScroll`     | `boolean`                | `false`                                | Blocks body scroll when open       |
| `appendTo`        | `string`                 | `'body'`                               | Where dialog is appended in DOM    |
| `baseZIndex`      | `number`                 | `0`                                    | Base z-index for stacking          |
| `breakpoints`     | `Record<string, string>` | `{ '960px': '75vw', '641px': '90vw' }` | Responsive widths                  |

#### Outputs

| Output          | Payload   | When fired                             |
| --------------- | --------- | -------------------------------------- |
| `visibleChange` | `boolean` | Supports `[(visible)]` two-way binding |
| `save`          | `void`    | Save button clicked                    |
| `cancelled`     | `void`    | Cancel button clicked                  |
| `onHide`        | `void`    | Dialog closed by any means             |

#### Content Slots

```html
<app-dialog-shell
    [(visible)]="createDialogVisible"
    [header]="'roles.form.createTitle' | transloco"
    [saveDisabled]="!newRole.name_en || !newRole.category"
    (save)="saveRole()"
    (cancelled)="createDialogVisible = false"
>
    <ng-template #dialogContent>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
                <label class="font-bold text-sm"
                    >{{ 'roles.form.roleName' | transloco }}</label
                >
                <input pInputText [(ngModel)]="newRole.name_en" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="font-bold text-sm"
                    >{{ 'roles.form.status' | transloco }}</label
                >
                <p-select
                    [options]="statusOptions"
                    [(ngModel)]="newRole.status"
                    appendTo="body"
                />
            </div>
        </div>
    </ng-template>

    <!-- Optional: override the footer entirely -->
    <ng-template #dialogFooter>
        <div class="flex justify-end gap-2">
            <p-button
                label="Close"
                severity="secondary"
                (onClick)="createDialogVisible = false"
            />
        </div>
    </ng-template>
</app-dialog-shell>
```

#### Sizing Guide

```typescript
[style] =
    "{ width: '450px' }"[style] = // Small — simple form
    "{ width: '700px' }"[style] = // Medium — multi-field form
    "{ width: '900px' }"[styleClass] = // Large — complex form or view
        "'app-dialog-lg'";
```
