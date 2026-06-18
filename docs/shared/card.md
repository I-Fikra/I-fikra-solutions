# SharedCardComponent

A reusable card wrapper that keeps card styling consistent across the project. It provides three named slot zones — header, body, and footer — and an optional click handler that activates hover styles automatically. All spacing, colors, borders, and transitions are defined inside the component so consumers only provide content.

---

## File locations

```
src/
└── app/
    └── shared/
        └── components/
            └── card/
                ├── card.ts
                └── card.html
```

---

## Anatomy

```
┌─────────────────────────────────────────┐
│  #cardHeader  (gray bg, border-bottom)  │  ← always rendered, py-3
├─────────────────────────────────────────┤
│                                         │
│  #cardBody    (white bg, flex-1)        │  ← optional
│                                         │
├─────────────────────────────────────────┤
│  #cardFooter  (gray bg, border-top)     │  ← always rendered, py-3
└─────────────────────────────────────────┘
```

**Header and footer are always rendered** regardless of whether a template is provided. When empty, they appear as a slim gray bar (`py-3`) that frames the card. Only the body is optional — omitting `#cardBody` removes that zone entirely.

---

## Basic usage

Import the component, then use the three named `ng-template` slots inside `<app-card>`.

```typescript
// your-feature.component.ts
import { Card} from '@shared/components/card/card';

@Component({
  standalone: true,
  imports: [Card],
  ...
})
```

```html
<!-- your-feature.component.html -->
<app-card>

  <ng-template #cardHeader>
    <!-- your header content -->
  </ng-template>

  <ng-template #cardBody>
    <!-- your body content -->
  </ng-template>

  <ng-template #cardFooter>
    <!-- your footer content -->
  </ng-template>

</app-card>
```

---

## Slot reference

| Slot name      | Zone    | Background                         | Padding     | Always rendered |
|----------------|---------|------------------------------------|-------------|-----------------|
| `#cardHeader`  | Top     | `surface-50` / dark: `surface-800` | `px-5 py-3` | ✅ yes          |
| `#cardBody`    | Middle  | `surface-0` / dark: `surface-900`  | `px-5 py-4` | ❌ no           |
| `#cardFooter`  | Bottom  | `surface-50` / dark: `surface-800` | `px-5 py-3` | ✅ yes          |

When `#cardHeader` or `#cardFooter` are omitted, their zone still renders as an empty gray bar. This keeps the card shape consistent and visually framed across the whole project.

> **Do not override padding or background colors from the consumer side.** If a design deviation is needed for a specific feature, raise it with the team so the component itself can be updated and the change stays consistent everywhere.

---

## Output events

| Event       | Payload | Description                                             |
|-------------|---------|---------------------------------------------------------|
| `cardClick` | `void`  | Emitted when the card is clicked. Entirely optional.    |

### How clickability works

The card detects whether a parent has bound to `(cardClick)` using Angular's `EventEmitter.observed`. No extra input or flag is needed:

- **`(cardClick)` bound** — card gets `cursor-pointer`, a shadow lift, and a primary-colored ring on hover.
- **`(cardClick)` not bound** — card looks and behaves like a static surface, no hover styles applied.

The same component is used for both clickable and non-clickable cards — the parent decides by simply binding the event or not.

---

## Examples

### Full card — header, body, and footer

```html
<app-card>

  <ng-template #cardHeader>
    <div class="flex items-center gap-2 min-w-0">
      <h2 class="m-0! text-xl! font-medium! truncate">John Doe</h2>
      <p-tag value="Active" severity="success" />
    </div>
    <p-button
      icon="pi pi-ellipsis-v"
      severity="secondary"
      [text]="true"
      size="small"
      (click)="openMenu($event)"
    />
  </ng-template>

  <ng-template #cardBody>
    <div class="flex justify-between text-sm py-1">
      <span class="text-surface-500">Email</span>
      <span class="font-semibold">john@example.com</span>
    </div>
    <div class="flex justify-between text-sm py-1">
      <span class="text-surface-500">Role</span>
      <span class="font-semibold">Admin</span>
    </div>
  </ng-template>

  <ng-template #cardFooter>
    <span class="text-xs text-surface-400">Last updated: 3 days ago</span>
    <p-button label="View" size="small" [text]="true" />
  </ng-template>

</app-card>
```

---

### Header and body only (empty footer bar)

Omitting `#cardFooter` still leaves a slim gray bar at the bottom — the card always has its top and bottom frame.

```html
<app-card>

  <ng-template #cardHeader>
    <h2 class="m-0! text-xl! font-medium!">Project Alpha</h2>
  </ng-template>

  <ng-template #cardBody>
    <p class="text-sm text-surface-500">Description goes here.</p>
  </ng-template>

</app-card>
```

---

### Body only (empty header and footer bars)

Even with only `#cardBody` provided, the gray header and footer bars still appear, keeping the card framed.

```html
<app-card>

  <ng-template #cardBody>
    <p class="text-sm">Only body content here — header and footer bars still show.</p>
  </ng-template>

</app-card>
```

---

### Clickable card

Bind `(cardClick)` to enable hover styles and emit an event on click. The parent handles what happens next.

```html
<app-card (cardClick)="onCardClick(item)">

  <ng-template #cardHeader>
    <h2 class="m-0! text-xl! font-medium! truncate">{{ item.name }}</h2>
  </ng-template>

  <ng-template #cardBody>
    <p class="text-sm text-surface-500">Click anywhere on the card to open.</p>
  </ng-template>

</app-card>
```

```typescript
onCardClick(item: MyItem): void {
  this.router.navigate(['/items', item.id]);
}
```

> **Watch out for nested clickable elements.** If the card has buttons or links inside (e.g. the ellipsis menu), those will also trigger `(cardClick)` due to event bubbling. Stop propagation on the inner element to prevent it:
>
> ```html
> <p-button
>   icon="pi pi-ellipsis-v"
>   (click)="openMenu($event); $event.stopPropagation()"
> />
> ```

---

### Inside a grid (the standard list/grid view pattern)

```html
<div [class]="'grid gap-x-5.25 ' + cardGridCols">
  @for (item of items; track item.id) {
  <div [class]="cardColSpan + ' mb-5.25'">
    <app-shared-card>

      <ng-template #cardHeader>
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <h2 class="m-0! text-xl! font-medium! truncate">{{ item.name }}</h2>
          <p-tag
            [value]="item.status | capitalize"
            [severity]="item.status | severity"
          />
        </div>
        <p-button
          icon="pi pi-ellipsis-v"
          severity="secondary"
          [text]="true"
          size="small"
          (click)="openRowMenu($event, item)"
        />
      </ng-template>

      <ng-template #cardBody>
        @for (col of columns; track col.field) {
        <div class="flex justify-between text-sm py-1">
          <span class="text-surface-500">{{ col.header }}</span>
          <span class="font-semibold">{{ item[col.field] }}</span>
        </div>
        }
      </ng-template>

      <ng-template #cardFooter>
        <span class="text-xs text-surface-400">{{ item.updatedAt | date }}</span>
      </ng-template>

    </app-shared-card>
  </div>
  }
</div>
```

---

## What not to do

**Do not add layout wrappers around the component.**
The component already handles `h-full`, `flex-col`, `overflow-hidden`, and `rounded-md`. Wrapping it in another flex or positioned container can break height behavior inside grids.

```html
<!-- ❌ avoid -->
<div class="flex flex-col h-full">
  <app-card> ... </app-card>
</div>

<!-- ✅ correct -->
<app-card> ... </app-card>
```

**Do not style the slots' outer zones from the consumer.**
Padding and background live in the component. Only style the content inside your `ng-template`.

```html
<!-- ❌ avoid — this targets nothing meaningful -->
<ng-template #cardHeader class="bg-red-500 p-10">

<!-- ✅ correct — style your own content inside the template -->
<ng-template #cardHeader>
  <div class="your-own-styles">...</div>
</ng-template>
```

---

## Extending the component

If a new project-wide style is needed (e.g. a card variant with a colored header), update `card.html` directly rather than overriding from consumer components. This keeps all card styling in one place.

For a one-off design that should not be shared, build a separate component that does not use `app-card`.

---

## Component source reference

```typescript
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './card.html',
})
export class Card {
  @ContentChild('cardHeader') headerTemplate?: TemplateRef<unknown>;
  @ContentChild('cardBody')   bodyTemplate?:   TemplateRef<unknown>;
  @ContentChild('cardFooter') footerTemplate?: TemplateRef<unknown>;

  @Output() cardClick = new EventEmitter<void>();

  get isClickable(): boolean {
    return this.cardClick.observed;
  }

  handleClick(): void {
    if (this.isClickable) {
      this.cardClick.emit();
    }
  }
}
```