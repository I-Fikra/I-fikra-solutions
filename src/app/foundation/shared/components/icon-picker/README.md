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
| **Performance (render)** | The grid is virtualized with `@angular/cdk/scrolling` (`cdk-virtual-scroll-viewport`), grouped into rows of 8 icons. Only the rows in/near the visible viewport are ever in the DOM, regardless of how many results match. |
| **Performance (search)** | Search runs fully client-side via a single shared Fuse.js index (fuzzy, typo-tolerant, no debounce needed — there's no network round-trip to throttle). |
| **Concurrency** | If two pickers are opened around the same time before the manifest has loaded, `IconStoreService.load()` returns the same in-flight `Promise` to both — only one HTTP request ever fires. |

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
  svg?: string;       // unused by the current dataset (reserved for inline-SVG sources)
  url?: string;        // "icons/svg/arrow-right.svg"
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

Constrain results to a subset for a specific usage context (the whole point of the `filter` input — e.g. a "social links" form should only offer brand icons):

```ts
onlySocialIcons = (icon: Icon) => ['facebook', 'x-twitter', 'instagram', 'linkedin'].some(
  (name) => icon.name.includes(name)
);
```

```html
<app-icon-picker
  [value]="selectedId"
  [filter]="onlySocialIcons"
  (iconChange)="onIconSelected($event)"
/>
```

`filter` is applied both to the unfiltered "browse" list and to search results, so the status row ("X icons" / "X results for ...") and the empty state stay accurate for the constrained set.

---

## i18n

Copy lives under the `shared.iconPicker.*` namespace in `public/i18n/{en,ar}/shared.json`:

`selectIcon`, `searchPlaceholder`, `totalIcons`, `resultsFor`, `noResults`, `noIconsAvailable`.

---

## Limitations / known gaps

- **No real category taxonomy.** The source `icons.zip` (Font Awesome Pro, "Light" style, 3,671 icons) ships SVGs only — no metadata file with Font Awesome's actual categories. `category` is set to `''` for every icon; `tags` are just the icon's name split on `-`. Use `filter` for any context-specific grouping instead of relying on `category`.
- **Single style.** Only the "Light" style was in the source archive — there's no solid/regular/duotone variant to switch between.
- **Licensing.** These are Font Awesome **Pro** icons (commercial license, per the SVG file headers) — keep usage within whatever license the project already holds; don't redistribute the `public/icons/` assets outside the app.
