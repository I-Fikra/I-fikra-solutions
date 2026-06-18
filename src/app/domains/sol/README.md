# `sol` — Solutions / Platform Builder Domain

This feature module powers the **"Solutions"** section of the app (menu id `solutions`,
route prefix `/sol`, feature id `SOL_FEATURE_ID = 'sol'`). It is the workspace where an
admin configures a generated project: picking which backend modules/features to scaffold,
branding the app (logo, metadata, social/OG tags, PWA manifest), customizing its look
(theme presets, colors, personality, color groups), and switching between the platform's
multiple projects (e.g. SIMW, Lady Driver, I‑Fikra Solutions).

It is lazy-loaded via `feature.ts` → `sol.routes.ts` and registered in
`src/app/config/domain.config.ts` under the `solutions` domain.

## Folder structure

```
sol/
├── feature.ts                 # Feature entry point: SOL_FEATURE_ID + lazy route loader
├── index.ts                   # Barrel export (re-exports feature.ts)
├── sol.routes.ts              # Route table for the `/sol/**` paths
│
├── configuration/             # "App Configuration" sub-feature (branding, theming, project setup)
│   ├── infrastructure/
│   │   ├── branding.service.ts      # BrandingService — root-singleton holding/persisting branding config
│   │   └── config-data.service.ts   # ConfigDataService — static catalogue of scaffoldable modules/features
│   │
│   └── presentation/
│       ├── configuration/           # AppConfigurationComponent — top-level page/orchestrator
│       │   ├── app-configuration.component.ts
│       │   ├── app-configuration.component.html
│       │   └── app-configuration.component.scss
│       │
│       ├── branding/                # "Branding" section (multi-step wizard)
│       │   ├── branding.ts/.html/.scss     # Branding — wizard shell, form state, save/reset/validation
│       │   └── tabs/
│       │       ├── branding-identity.ts/.html      # App name, logo, favicon, show-name toggle, version
│       │       ├── branding-metadata.ts/.html      # SEO meta title/description/keywords, support email/url, legal documents
│       │       ├── branding-social.ts/.html        # Open Graph card fields, social network links + live preview
│       │       └── branding-pwa.ts/.html           # PWA manifest fields (short name, theme/background color)
│       │
│       ├── customize/               # "Customize" section (appearance, personality, color groups)
│       │   └── customize.ts/.html/.scss
│       │
│       └── domains/                 # "Project Setup" section
│           └── config.ts/.html/.scss   # ConfigComponent — pick backend modules/features to scaffold
│
└── platforms/                 # Platform-switching sub-feature
    └── presentation/platforms/
        └── platforms.ts/.html/.scss   # Platforms — view & switch the active generated project
```

## Top-level files

| File | Purpose |
|---|---|
| `feature.ts` | Declares `SOL_FEATURE_ID = 'sol'` and `loadSolFeatureRoutes()`, the lazy entry point referenced from `domain.config.ts`. |
| `index.ts` | Barrel that re-exports `feature.ts` (the public surface of the domain). |
| `sol.routes.ts` | Defines the `/sol/**` routes: `app-config` & `demo-preview` → `AppConfigurationComponent`, `platforms/:id` → `Platforms`. |

## `configuration/` — App Configuration sub-feature

This is the bulk of the domain: a 3-section workspace (**Branding → Customize → Project Setup**)
rendered by `AppConfigurationComponent`.

### `infrastructure/`

- **`branding.service.ts`** — `BrandingService` (`providedIn: 'root'`, app-wide singleton).
  Holds the `BrandingConfig` interface (`languages` plus identity, metadata/SEO, social/OG,
  PWA fields), `DEFAULTS`, and persists to `localStorage` under `app_branding_v3`. Exposes
  computed signals (`appName`, `logo`, `metaTitle`, `themeColor`, `shortName`, full `config`)
  plus `save()`/`update()`. **Note:** because it's a singleton, its `_config` signal is loaded
  **once** at construction (`signal<BrandingConfig>(this._load())`) — clearing
  `localStorage` mid-session won't refresh it without a full page reload.
  - **`languages: string[]`** — lets the client pick which subset of
    `SUPPORTED_APP_LANGUAGES` the *generated app* ships in (set via the multi-select "App
    Languages" chips on the Identity tab — see `branding-identity.ts`'s
    `availableLanguages`/`toggleLanguage()`; at least one language must always stay
    selected). This drives which `LocalizedText` columns the wizard shows/validates (see
    below); it is not related to the *admin UI's* own language, which is controlled
    separately by `SettingsService`/`LangSwitcher`.
  - **`AppLanguage` / `SUPPORTED_APP_LANGUAGES`:** the catalog of languages the platform
    builder can generate apps in — `{ code, label, rtl }[]`, currently seeded with `en`,
    `ar` (`rtl: true`), `fr`, `es`, `de`. This is the single source of truth: the language
    selector, every `.locale-field` column, and the backend payload shape are all derived
    from it. Add a language by appending an entry here — no other file needs to change.
  - **Multilingual fields (`LocalizedText`):** since the platform builder can generate apps
    in any subset of the catalog, every field that ends up rendered to the generated app's
    *end users* is stored as `LocalizedText` (`Record<string, string | undefined>`, one
    optional entry per language code) rather than a plain `string` — currently `appName`,
    `metaTitle`, `metaDescription`, `metaKeywords`, `metaAuthor`, `copyrightText`,
    `ogTitle`, `ogDescription`, and `shortName`. A missing key just means "not translated
    yet" (e.g. a language just toggled on has no entry until the user types something) —
    always read with `value[code] ?? ''`, never assume the key exists. Fields that don't
    get translated (URLs, emails, handles, colors, the version string, images) stay
    single-value. The `appName`/`metaTitle`/`shortName` selectors merge per-language via
    `_mergeLocalized()` so an empty value for one code falls back to the matching code of
    `appName` rather than mixing languages. `STORAGE_KEY` was bumped from `_v2` to `_v3`
    when this shape changed, so old single-string branding data is dropped (replaced by
    `DEFAULTS`) rather than mis-typed on load.
  - **Multilingual uploads (`LocalizedDocument`):** optional legal documents the generated
    app may show per locale (`privacyPolicyDocument`, `termsDocument`) — accepted formats:
    HTML, TXT, DOCX. Follow the same idea as `LocalizedText` but for files:
    `LocalizedDocument` is `Record<string, string | null>`, one base64 data-URL upload per
    language code, mirroring how `logo`/`favicon`/`ogImage` store images — a missing/`null`
    entry means "not uploaded" for that language. The Metadata tab renders one optional
    upload slot per `activeLanguages()` entry (drop zone → "View document"/replace/remove
    preview), reusing the `FileReader.readAsDataURL` pattern from `onLogoFileChange`.
  - **`buildApiPayload()` / `BrandingPayload` / `LocalizedTextPayload` / `LocalizedDocumentPayload`:**
    the **backend payload** needs to distinguish "this app doesn't ship in this language" from
    "translated/uploaded but left blank". `buildApiPayload(config?)` maps a `BrandingConfig` to
    a `BrandingPayload` where every `LocalizedText` field becomes a `LocalizedTextPayload` and
    every `LocalizedDocument` field becomes a `LocalizedDocumentPayload`
    (both `Record<string, string | null>`) carrying **one entry per `SUPPORTED_APP_LANGUAGES`
    code** (a stable shape regardless of which/how-many languages a given app ships in): a
    language **not** in `config.languages` is sent as `null`, the active language(s) keep
    their value (`?? ''` for text, `?? null` for documents). Call this when wiring up the actual save-to-backend
    request — don't send `this.config()`/`brandingForm()` directly.
- **`config-data.service.ts`** — `ConfigDataService`. Returns a static, hard-coded catalogue
  (`ConfigData` → `ConfigModule[]`) describing the scaffoldable backend domains (IAM Identity,
  Auth, Roles, Organizations, Notifications, Payments, Audit, Localization, Storage,
  Analytics) each with toggleable `ConfigFeature`s and `ConfigSubOption`s. Used purely to
  drive the "Project Setup" picker UI — not a real backend call (wrapped in `of(...).pipe(delay(300))`
  to simulate latency).

### `presentation/configuration/` — orchestrator page

- **`AppConfigurationComponent`** (`app-configuration.component.ts/.html/.scss`) — the page
  shell shown at `/sol/app-config`. Owns:
  - `navSections`: the 3 top-level sections (`branding` | `customize` | `setup`) and their
    nav metadata (icon/label/description).
  - `activeSection` signal + `setSection()`/`isSectionDone()` for navigation & a "done" checkmark per section.
  - `doneSections`: a `Set<SectionKey>` updated via callbacks wired to child outputs —
    `onBrandingSaved()` (from `<app-branding (saved)="...">`) and `onCustomizeDone()`
    (from `<app-customize (themeApplied)="...">`).
  - Renders `<app-branding>`, `<app-customize>`, and `<app-config>` (Project Setup) based
    on the active section, plus a shared `<p-toast />` (it `provides: [MessageService]` at
    this level so toasts from any child bubble up to one shared toast instance).

### `presentation/branding/` — Branding section (wizard)

- **`Branding`** (`branding.ts/.html/.scss`, selector `app-branding`) — a 5-step wizard
  shell (`components → identity → metadata → social → pwa`) built on `p-steps`. Responsibilities:
  - Owns the working copy of the form: `brandingForm` signal seeded from `BrandingService.config()`.
  - Per-tab validation: `componentsValid`/`identityValid`/`metadataValid`/`socialValid`/`pwaValid`
    computed signals + a `tabValidation` lookup map drive `goToNextBrandingTab()` — it blocks
    advancing (and flips a `xxxSubmitted` flag to show inline errors) until the active
    tab's required fields are filled.
  - `onPatch()` receives `(patch)` events from the tab children and merges them into `brandingForm`.
  - `saveBranding()` persists via `BrandingService.save()`, emits `saved` (consumed by the
    parent's `onBrandingSaved()`), and shows a success toast.
  - `resetCurrentTab()` reverts **only the active tab's fields** back to the last-saved
    config, using a `tabFields` map of `BrandingTabKey → (keyof BrandingConfig)[]`.
  - Uses `encapsulation: ViewEncapsulation.None` so its styles (which duplicate the shared
    `.config-section`/`.config-card`/`.config-field` look from the parent's stylesheet)
    apply globally — see "Styling pattern" below.

- **`tabs/`** — one dumb/presentational component per wizard step. Each receives the shared
  `form` (a `BrandingConfig` `input.required`) plus a `submitted` flag (to show validation
  errors only after a next-attempt), and emits a `patch` (`Partial<BrandingConfig>`) event
  that the parent merges in:
  - **`branding-components`** — the first step: lets the client pick which products the
    platform builder should generate (`platformComponents: Record<string, number>`, keyed
    by `PlatformComponentType.key` from the `PLATFORM_COMPONENT_TYPES` catalog — currently
    "Mobile Application", "Landing Page", "Dashboard"). Renders one clickable card per
    catalog entry; clicking toggles it on (quantity 1) and reveals a `+`/`-` quantity
    stepper so the client can request e.g. "2 mobile applications". At least one product
    with quantity ≥ 1 must be selected to advance (`componentsValid`). A live summary list
    recaps the full selection (`selection`/`totalCount` computed signals). Follows the same
    catalog-driven approach as `SUPPORTED_APP_LANGUAGES` — add a product by appending to
    `PLATFORM_COMPONENT_TYPES`, no other file needs to change.
  - **`branding-identity`** — app name, logo/favicon upload + preview (with square-image
    validation for favicon), "show app name" toggle, semantic version (`metaVersion`) split
    into major/minor/patch steppers.
  - **`branding-metadata`** — SEO `metaTitle`/`metaDescription`/`metaKeywords`/`metaAuthor`,
    an optional `authorUrl` (turns the author/company name in the footer copyright into a
    clickable link — single value, not localized, since it's typically one site regardless
    of language), `copyrightText`, support email/url, and per-language privacy-policy &
    terms-of-service document uploads (`privacyPolicyDocument`/`termsDocument`, optional,
    HTML/TXT/DOCX, one file per active language).
  - **`branding-social`** — Open Graph fields (`siteUrl`, `ogTitle`, `ogDescription`,
    `ogImage` upload + preview) with a live social-card preview driven by `previewDomain`
    (parses the host out of `siteUrl`), plus a catalog-driven **Social Links** list
    (`socialLinks: Record<string, string>`, one URL per network keyed by `SocialPlatform.key`
    — see `SOCIAL_PLATFORMS`: Facebook, Instagram, X, YouTube, LinkedIn, TikTok). A blank
    field means that platform is omitted from the generated app; add a network by appending
    an entry to `SOCIAL_PLATFORMS` — no other file needs to change.
  - **`branding-pwa`** — PWA manifest fields: `shortName`, `themeColor`, `backgroundColor`.

### `presentation/customize/` — Customize section

- **`Customize`** (`customize.ts/.html/.scss`, selector `app-customize`) — a 3-tab panel
  (`appearance | personality | color-groups`):
  - **Appearance tab**: "Theme Templates" gallery (`THEME_BUNDLES` — ready-made
    preset+primary+surface+dark combos with a rich CSS-mockup preview per card,
    applied via `applyThemeBundle()`), Dark Mode toggle, UI Preset picker (Aura/Lara/Nora),
    Primary/Surface color swatches (`SURFACES` palette list), Menu Mode (static/overlay),
    and a Preview-on-Page / Reset-to-Snapshot flow (`startPreview()`/`resetToSnapshot()`)
    that snapshots `LayoutService.layoutConfig()` so changes can be trialled and undone.
    All theme math (building primary-color palettes per preset, generating PrimeNG preset
    extensions for light/dark color schemes) lives in the private helpers
    `_buildPrimaryColors()` / `_getPresetExt()`.
  - **Personality tab**: simply hosts `<app-personality-picker />`
    (from `foundation/core/theme-builder`).
  - **Color Groups tab**: lets admins define named palettes (`ColorGroup[]`) that end users
    can later choose from — add/remove groups, add/remove/edit individual swatch colors,
    and mark one swatch as the group's active color.
  - Emits `themeApplied` (`output<void>()`) when a theme bundle is applied, which the
    parent uses to mark the "customize" section as done.
  - Like `Branding`, uses `encapsulation: ViewEncapsulation.None` and duplicates the shared
    `.config-section`/`.config-card`/etc. styles in its own `.scss`.

### `presentation/domains/` — Project Setup section

- **`ConfigComponent`** (`config.ts/.html/.scss`, selector `app-config`) — the
  module/feature picker that drives "what gets generated". Loads the static catalogue from
  `ConfigDataService`, then lets the admin:
  - search/filter modules, select/deselect whole modules (`toggleModuleSelected`,
    `selectAllModules`, `clearAllModules`),
  - drill into a module to toggle individual features and their sub-options
    (`toggleFeature`, `toggleSubOption`, `isSubOptionSelected`),
  - "Generate Project" (`onConfirm()` — currently just toasts + logs the selection),
  - export the current selection as JSON (`onExport()`), or open a live demo preview in a
    new tab (`openPreviewDemo()` → `/sol/demo-preview?modules=...`).

## `platforms/` — Platform switching sub-feature

- **`Platforms`** (`platforms.ts/.html/.scss`, selector `app-platforms`, route
  `/sol/platforms/:id`) — reads the `:id` route param, looks it up against
  `ProjectConfigService.availableProjects()`, and shows that project's branding preview
  (sanitizing its `logoSvg` and substituting `var(--primary-color)` with the project's
  actual `primaryColor`). The `apply()` action calls `ProjectConfigService.switchProject()`
  to make it the active project app-wide. This is what the `solutions` domain's
  `subModulesFactory` in `domain.config.ts` links to per-project (`/sol/platforms/<projectId>`).

## Conventions & patterns worth knowing

- **Signals everywhere.** State is modeled with `signal`/`computed`/`input`/`output`; no
  `@Input`/`@Output` decorators or `EventEmitter` — use `input()`/`output()`.
- **Section/tab orchestration pattern.** A parent owns `active*` signals + a `doneSections`
  (or similar) tracking set; children are presentational/feature components that emit a
  single `output<void>()` (e.g. `saved`, `themeApplied`) on completion, which the parent
  maps to its own "done" bookkeeping. Don't reach into child internals — extend via inputs/outputs.
- **Styling pattern — `ViewEncapsulation.None` + duplicated "shared" classes.** Components
  extracted out of `AppConfigurationComponent` (`Branding`, `Customize`, and the
  `branding-*` tab components) set `encapsulation: ViewEncapsulation.None` and **copy** the
  shared `.config-section` / `.config-card` / `.config-field` / etc. rules into their own
  `.scss`, rather than relying on the parent's styles leaking in (Angular's emulated
  encapsulation won't apply a parent's styles to a child component's template). When adding
  a new extracted section, follow the same approach: set `ViewEncapsulation.None` and copy
  the relevant shared style blocks from an existing sibling (e.g. `branding.scss` or
  `customize.scss`) rather than inventing new class names.
- **Multilingual (`LocalizedText`) display fields, scoped to active `languages`.** Anything
  that ends up rendered to a generated app's end users is collected as `LocalizedText`
  (`Record<string, string | undefined>`, see `branding.service.ts`) and rendered as one
  column per active language using the shared
  `.locale-field`/`.locale-field__col`/`.locale-field__lang` SCSS classes (a flex-wrap row,
  defined once in `branding.scss`, available globally thanks to `ViewEncapsulation.None`).
  RTL languages (per `AppLanguage.rtl`, e.g. Arabic) get `[dir]="lang.rtl ? 'rtl' : 'ltr'"`.
  - The client can choose any subset of `SUPPORTED_APP_LANGUAGES` to ship the generated app
    in (`BrandingConfig.languages`, set via the multi-select chips on the Identity tab — at
    least one must stay selected). Each tab component derives an `activeLanguages` computed
    signal (`AppLanguage[]`, filtered from the catalog by `form().languages`) and uses it to:
    (a) `@for (lang of activeLanguages(); track lang.code)` over `.locale-field__col`s so
    only the active language column(s) render — the row wraps automatically to fit however
    many are selected, no `--en-only`/`--ar-only` collapsing needed — and (b) scope
    required-field validation to only the languages actually shown (e.g.
    `activeLanguages().some(lang => !(form().appName[lang.code] ?? '').trim())`).
  - **Template expressions can't use ES6 computed property syntax** (`{ [code]: value }` →
    `Parser Error: Unexpected token [`), so patching a `LocalizedText` field can't be done
    inline. Every tab component instead exposes a
    `patchLocalized(field: keyof BrandingConfig, code: string, value: string)` helper that
    does the `{ ...current, [code]: value }` merge in TypeScript and
    `patch.emit({ [field]: merged } as Partial<BrandingConfig>)`; templates call
    `(ngModelChange)="patchLocalized('appName', lang.code, $event)"`. A toggled-on language
    has no entry until the user types something — always read with
    `form().appName[lang.code] ?? ''`, never assume the key exists (no pre-population/
    migration happens when `languages` changes). Follow this pattern for any new
    user-facing text field added to branding (or elsewhere in the platform-builder forms).
  - Live previews (Identity Preview, Social card preview) must also respect the active
    languages rather than hardcoding a code — see `previewName()` in `branding-identity.ts`
    and the generic `firstNonEmpty(...values: LocalizedText[])` helper in
    `branding-social.ts` (`previewTitle`/`previewDescription`), which walks
    `activeLanguages()` in catalog order and returns the first non-empty value across the
    given fallback chain.
- **Per-tab validation gating** (see `Branding.tabValidation` / `tabFields`): a
  `Record<TabKey, {...}>` lookup map keeps tab-specific logic (validity check, which fields
  belong to that tab, which `submitted` flag to flip) declarative and easy to extend when a
  new tab is added — add one entry to the map rather than branching with `if/switch`.
- **`BrandingService` is a root singleton loaded once.** If you need it to reflect external
  changes to `localStorage['app_branding_v2']` mid-session, you currently need a full page
  reload — there's no live-refresh mechanism.
- **`ConfigDataService` is static/mock data.** `getData$()` returns a hard-coded catalogue
  wrapped in `of(...).pipe(delay(300))` — there's no real backend call yet; "Generate
  Project" / export are placeholder/demo actions.

## Adding a new section to App Configuration

1. Add the section's key to `SectionKey` and an entry in `navSections` in
   `app-configuration.component.ts`.
2. Build it as its own standalone component (mirror `Branding`/`Customize`): own
   `.ts/.html/.scss`, `ViewEncapsulation.None`, duplicate the shared `config-*` style
   blocks it needs, and expose a single `output<void>()` for "this section is complete".
3. Render it conditionally in `app-configuration.component.html`
   (`@if (activeSection() === 'your-key') { <app-your-section (xxx)="onYourSectionDone()" /> }`)
   and wire that output to a new `onYourSectionDone()` that updates `doneSections`.
4. Register the component in `AppConfigurationComponent`'s `imports` array.
