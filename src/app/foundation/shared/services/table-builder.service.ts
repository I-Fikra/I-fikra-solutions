import { Injectable } from '@angular/core';
import { TableColumn } from '@/app/foundation/shared/models/table.models';

export interface RawMetaColumn {
  secondary_code: string;
  name: string;
  type: string;
  is_public: number; // -1 = hidden, 0 = form-only, 1 = visible in table & form
  order: number;
  icon: string | null;
  enum: any | null;
  lookup: any | null;
}

export interface TableResponse<T = any> {
  items: T[];
  columns: TableColumn[];
  pageTitle: string;
  /** Raw meta_data from the API — used to build dynamic forms */
  rawMeta: RawMetaColumn[];
  /** Alias for rawMeta — for compatibility */
  metaData: RawMetaColumn[];
}

export interface TableBuilderConfig {
  /** Extra keys to hide (on top of is_public === -1) */
  excludedKeys?: string[];
  /** Override column type per secondary_code */
  columnTypeMap?: Record<string, TableColumn['type']>;
  /** Path to the items array inside the response, e.g. 'result.items' */
  itemsPath?: string;
  /** Path to the meta_data array inside the response, e.g. 'result.meta_data' */
  metaPath?: string;
  /** Path to the page title inside the response, e.g. 'result.paging.page_title' */
  titlePath?: string;
  /** Extra substrings that identify the primary "name" column */
  nameHints?: string[];
}

// ── Column types mapped from API type strings ─────────────────────────────────

const API_TYPE_MAP: Record<string, TableColumn['type']> = {
  NUMBER: 'numeric',
  DATE: 'date',
  BOOLEAN: 'status',
  STRING: 'text'
};

// ── Keys that always carry status semantics regardless of API type ─────────────

const STATUS_KEYS = new Set([
  'role_status_name',
  'status',
  'الحالة',
  'active',
  'مفعل'
]);

// ── Keys that are internal/color helpers — never shown ────────────────────────

const INTERNAL_KEYS = new Set([
  'role_status_color',
  'status_color',
  'vessel_status_color'
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a dot-notation path from an object. e.g. 'result.paging.page_title' */
const resolvePath = (obj: any, path: string): any =>
  path.split('.').reduce((acc, key) => acc?.[key], obj);

const isNameField = (key: string, hints: string[]): boolean =>
  hints.some((hint) => key.toLowerCase().includes(hint));

const isStatusCol = (m: any): boolean =>
  m.type === 'STATUS' ||
  STATUS_KEYS.has(m.secondary_code) ||
  ['status', 'الحالة', 'حالة'].some((h) =>
    m.secondary_code.toLowerCase().includes(h)
  );

const DEFAULT_NAME_HINTS = ['name', 'اسم', 'title', 'عنوان', 'label', 'تسمية'];

/**
 * Sanitize a value that will be rendered by Angular's DatePipe.
 *
 * DatePipe throws NG02311 when it receives anything that isn't a Date,
 * a valid date-string, or a number — including the placeholder "—" that
 * the API sometimes returns for absent dates.
 *
 * Returning `null` is safe: DatePipe renders nothing for null and does
 * NOT throw.
 */
const sanitizeDateValue = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (
    str === '' ||
    str === '—' ||
    str === '-' ||
    str === 'null' ||
    str === 'undefined'
  ) {
    return null;
  }
  return str;
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TableBuilderService {
  /**
   * Builds a TableResponse from a raw API response.
   *
   * Column definitions come from `meta_data`:
   *   - `name`           → column header (already localised by the API)
   *   - `secondary_code` → field key
   *   - `is_public`      → -1 = hidden, 0 = internal, 1 = visible
   *   - `type`           → NUMBER | DATE | BOOLEAN | STRING
   *   - `order`          → column sort order
   *
   * Page title comes from `paging.page_title` (also localised by the API).
   *
   * @example
   * map(res => this.tableBuilder.build(res, {
   *     itemsPath: 'result.items',
   *     metaPath:  'result.meta_data',
   *     titlePath: 'result.paging.page_title',
   * }))
   */
  build<T = any>(raw: any, config: TableBuilderConfig = {}): TableResponse<T> {
    const {
      excludedKeys = [],
      columnTypeMap = {},
      itemsPath = 'result.items',
      metaPath = 'result.meta_data',
      titlePath = 'result.paging.page_title',
      nameHints = []
    } = config;

    const items: T[] = resolvePath(raw, itemsPath) ?? [];
    const pageTitle: string = resolvePath(raw, titlePath) ?? '';
    const metaData: any[] = resolvePath(raw, metaPath) ?? [];

    const extraExcluded = new Set(excludedKeys);
    const mergedHints = [...DEFAULT_NAME_HINTS, ...nameHints];

    let columns: TableColumn[]; // kept as let for the fallback branch below

    if (metaData.length > 0) {
      // ── Build columns from meta_data ───────────────────────────────────
      const visible = metaData
        .filter((col) => {
          if (INTERNAL_KEYS.has(col.secondary_code)) return false;
          if (col.is_public === -1) return false;
          if (extraExcluded.has(col.secondary_code)) return false;
          return true;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // Detect primary "name" column
      const textEntries = visible.filter(
        (m) => !isStatusCol(m) && (API_TYPE_MAP[m.type] ?? 'text') === 'text'
      );
      const primaryEntry =
        textEntries.find((m) => isNameField(m.secondary_code, mergedHints)) ??
        textEntries[0];
      const primaryCode = primaryEntry?.secondary_code;

      columns = visible.map((col) => {
        const field = col.secondary_code as string;

        const type: TableColumn['type'] =
          columnTypeMap[field] ??
          (isStatusCol(col) ? 'status' : undefined) ??
          API_TYPE_MAP[col.type as string] ??
          'text';

        return {
          field,
          header: col.name as string,
          type,
          sortable: true,
          filterable: true,
          isPrimary: field === primaryCode,
          isStatus: type === 'status'
        } satisfies TableColumn;
      });
    } else {
      // ── Fallback: infer columns from first item keys ────────────────────
      columns = this.buildColumnsFromItem(
        (items[0] as any) ?? {},
        extraExcluded,
        columnTypeMap
      );
    }

    return { items, columns, pageTitle, rawMeta: metaData, metaData };
  }

  // ── Private: legacy key-inference fallback ────────────────────────────────

  private buildColumnsFromItem(
    firstItem: Record<string, any>,
    excluded: Set<string>,
    typeMap: Record<string, TableColumn['type']>
  ): TableColumn[] {
    const colType = (key: string): TableColumn['type'] =>
      typeMap[key] ?? (STATUS_KEYS.has(key) ? 'status' : undefined) ?? 'text';

    const visibleKeys = Object.keys(firstItem).filter(
      (k) => !excluded.has(k) && !INTERNAL_KEYS.has(k)
    );

    const textKeys = visibleKeys.filter((k) => colType(k) === 'text');
    const primaryKey = textKeys[0];

    const raw: TableColumn[] = visibleKeys.map((key) => ({
      field: key,
      header: key,
      type: colType(key),
      sortable: true,
      filterable: true,
      isPrimary: key === primaryKey,
      isStatus: colType(key) === 'status'
    }));

    return [
      ...raw.filter((c) => c.isPrimary),
      ...raw.filter((c) => c.isStatus && !c.isPrimary),
      ...raw.filter((c) => !c.isPrimary && !c.isStatus)
    ];
  }
}
