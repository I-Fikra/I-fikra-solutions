# Icon Picker

A reusable `<app-icon-picker>` for choosing one icon out of a ~3,700-icon set, with fuzzy search and good performance/memory/network behavior. Built for use in multiple, unrelated places across the app (theme builder, form fields, branding config, etc.) without each usage paying the cost of re-fetching or re-indexing the icon set.

---

## Folder Structure

```
icon-picker/
├── models/
│   └── icon.model.ts          ← Icon interface
├── services/
│   └── icon-store.service.ts  ← singleton: fetch + cache + Fuse.js index
├── icon-picker.component.ts
├── icon-picker.component.html
├── icon-picker.component.scss
├── index.ts                   ← public API barrel
└── README.md
```

Icon assets live outside this folder, under `public/icons/`:

```
public/icons/
├── icons-manifest.json   ← one row per icon: {id, name, tags, category, url}
└── svg/                  ← 3,671 individual .svg files
```

`scripts/generate-icons-manifest.mjs` (repo root) regenerates `icons-manifest.json` from whatever files exist in `public/icons/svg/` — run it again after adding/removing/renaming icon files.

---

## Why it's built this way

| Concern | Approach |
|---|---|
| **Network** | The manifest (~60-100KB gzipped) is fetched **once**, lazily, the first time *any* picker on the page is opened — not on app boot. Icon artwork is **not** inlined into the manifest; each icon is its own small `.svg` file referenced by `url`, so the browser only requests the handful that actually become visible. |
| **Memory** | `IconStoreService` is `providedIn: 'root'` — one in-memory copy of the icon list and one Fuse.js index for the whole app, shared by every `<app-icon-picker>` instance. Opening a second picker reuses the already-loaded data instantly. |
| **Performance (render)** | The grid is virtualized **vertically** with `@angular/cdk/scrolling` (`cdk-virtual-scroll-viewport`), grouped into rows. Only the rows in/near the visible viewport are ever in the DOM, regardless of how many results match. Cells are fixed-size (80×76px) and wrap their label instead of truncating it, so row height stays uniform — virtual scroll requires a constant `itemSize`. |
| **Performance (search)** | Search runs fully client-side via a single shared Fuse.js index (fuzzy, typo-tolerant, no debounce needed — there's no network round-trip to throttle). |
| **Concurrency** | If two pickers are opened around the same time before the manifest has loaded, `IconStoreService.load()` returns the same in-flight `Promise` to both — only one HTTP request ever fires. |
| **Responsive sizing** | On open, the popover measures the trigger button's live width (`offsetWidth`, clamped to `[280px, 90vw]`) and applies it via PrimeNG's `Popover` `style` input — the dropdown always matches whatever field it's attached to, and how many fixed-width columns fit per row (`columnsPerRow`) is recomputed from that same width. |

---

## API

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| null` | `null` | Currently selected icon's `id` (its `name`, e.g. `"arrow-right"`). |
| `filter` | `(icon: Icon) => boolean` | `undefined` | Optional predicate to constrain which icons are selectable/searchable in this usage context (see below). |
| `placeholder` | `string` | `''` | Overrides the search box placeholder. Falls back to the translated `shared.iconPicker.searchPlaceholder` key when empty. |
| `disabled` | `boolean` | `false` | Disables the trigger button. |

### Outputs

| Output | Payload | Fires when |
|---|---|---|
| `iconChange` | `Icon \| null` | An icon is selected (`Icon`), or the selection is cleared (`null`). |

### `Icon` shape

```ts
interface Icon {
  id: string;       // == name, unique
  name: string;      // e.g. "arrow-right"
  tags: string[];    // name split on "-", e.g. ["arrow", "right"]
  url: string;        // "icons/svg/arrow-right.svg"
  category: string;   // always '' today — see Limitations
}
```

---

## Usage

```html
<!-- Basic -->
<app-icon-picker
  [value]="form.get('icon')?.value"
  (iconChange)="form.get('icon')?.setValue($event?.id ?? null)"
/>
```

```ts
import { IconPickerComponent, Icon } from '@/app/foundation/shared/components/icon-picker';
```

Constrain results to a subset for a specific usage context (the whole point of the `filter` input — e.g. a "contact method" field should only offer communication-related icons):

```ts
onlyContactIcons = (icon: Icon) => ['phone', 'envelope', 'comment', 'at', 'paper-plane', 'share-nodes'].some(
  (name) => icon.name.includes(name)
);
```

```html
<app-icon-picker
  [value]="selectedId"
  [filter]="onlyContactIcons"
  (iconChange)="onIconSelected($event)"
/>
```

Note there are no brand/social logos (Facebook, LinkedIn, etc.) in this set — see Limitations.

`filter` is applied both to the unfiltered "browse" list and to search results, so the status row ("X icons" / "X results for ...") and the empty state stay accurate for the constrained set.

---

## i18n

Copy lives under the `shared.iconPicker.*` namespace in the root `public/i18n/{en,ar}.json` files 

---

## Limitations / known gaps

- **No brand/logo icons.** This is Font Awesome's UI icon family only — brand logos (Facebook, LinkedIn, etc.) belong to a separate "Brands" family that wasn't part of this archive. A field that used to store a brand icon has no equivalent here; pick the closest generic icon (e.g. `link`) or leave it unset.
- **Licensing.** These are Font Awesome **Pro** icons (commercial license, per the SVG file headers) — keep usage within whatever license the project already holds; don't redistribute the `public/icons/` assets outside the app.
