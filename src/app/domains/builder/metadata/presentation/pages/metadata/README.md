# Metadata Page — Domains / Modules / Entities

This page browses the platform's metadata as a 3-level hierarchy:

```
Domain
  └─ Module
       └─ Entity
```

## Files

- `metadata.ts` — defines the `DOMAINS_SOURCE` map and builds the sorted `domains` signal; also holds dialog state
- `metadata.html` — renders collapsible domain/module panels (`p-panel`) and entity cards
- `metadata.scss` — empty (styling is done via Tailwind utility classes per project convention)

## Data shape

```ts
DOMAINS_SOURCE: Record<string /* domain */, Record<string /* module */, string[] /* entities */>>
```

`buildDomains()` converts this into `MetadataDomain[]`, sorting domains, modules and entities
alphabetically:

```ts
interface MetadataEntity { name: string; }
interface MetadataModule { name: string; entities: MetadataEntity[]; }
interface MetadataDomain { name: string; modules: MetadataModule[]; }
```

## UI

- Each **domain** is a toggleable `p-panel` (expanded by default), with an icon + module count badge.
- Each **module** is a nested toggleable `p-panel` (collapsed by default), with an entity count badge.
- Each **entity** is rendered as a clickable card. Clicking it calls `openEntity(domain, module, entity)`,
  which opens an `app-dialog-shell` popup showing the entity name, its module and domain.

## Replacing the static data with a real API

1. Inject a data service that returns the domain/module/entity hierarchy
2. Replace `DOMAINS_SOURCE` / the `domains` signal initializer with data from the service
   (still run it through `buildDomains()`, or have the API return pre-sorted data)
3. Extend the dialog content in `metadata.html` (`#dialogContent`) with real entity metadata
   once it's available
