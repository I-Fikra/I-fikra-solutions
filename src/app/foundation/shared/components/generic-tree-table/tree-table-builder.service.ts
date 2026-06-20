import { Injectable } from '@angular/core';
import { TreeTableColumn } from '@/app/foundation/shared/components/tree-table/tree-table';
// FIX: ApiMetaColumn lives in ../../services/base-api.service, not ./base-api.service
import { ApiMetaColumn } from '../../services/base-api.service';
import { TreeItemRaw, TreeChildrenBlock } from './base-tree-api.service';

// ── Public shapes ──────────────────────────────────────────────────────────────

/** One processed tree item — ready for the tree-table component */
export interface TreeTableItem {
  /** Nesting level (1 = entity, 2 = child, 3 = grandchild) */
  level: number;
  /** Translated label (AR or EN, chosen at build time) */
  label: string;
  /** Grouping module name (categories / permissions) */
  module?: string;
  /** Raw data bag — fields keyed by secondary_code */
  data: Record<string, unknown>;
  /** Processed children (null when leaf node) */
  children: TreeTableChildren | null;
}

export interface TreeTableChildren {
  data: TreeTableItem[];
  columns: TreeTableColumn[];
  /** Raw meta for export / form builders */
  rawMeta: ApiMetaColumn[];
}

/**
 * Full response from TreeTableBuilderService.build()
 * — mirrors TableResponse from table-builder.service
 */
export interface TreeTableResponse {
  /** Processed entity-level items */
  items: TreeTableItem[];
  /** Entity-level columns */
  columns: TreeTableColumn[];
  /** Page title (from paging.page_title) */
  pageTitle: string;
  /** Raw entity-level meta_data (for export / forms) */
  rawMeta: ApiMetaColumn[];
}

// ── Config ─────────────────────────────────────────────────────────────────────

export interface TreeTableBuilderConfig {
  /** Extra secondary_codes to hide (on top of is_public === -1) */
  excludedKeys?: string[];
  /** Force a specific TreeTableColumn cellType per secondary_code */
  cellTypeMap?: Record<string, TreeTableColumn['cellType']>;
  /** Severity map per secondary_code — used for tag cells */
  severityMaps?: Record<
    string,
    Record<string, 'success' | 'warn' | 'secondary' | 'danger' | 'info'>
  >;
  /** Path to items   — default: 'result.items'             */
  itemsPath?: string;
  /** Path to meta    — default: 'result.meta_data'         */
  metaPath?: string;
  /** Path to title   — default: 'result.paging.page_title' */
  titlePath?: string;
  /** If true, read label_en instead of label (default: false → AR) */
  useEnglish?: boolean;
}

// ── Internals ──────────────────────────────────────────────────────────────────

const INTERNAL_KEYS = new Set([
  'status_color',
  'vessel_status_color',
  'category_status_color',
  'org_status_color'
]);

const STATUS_HINTS = ['status', 'الحالة', 'حالة'];

function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc as any)?.[k], obj);
}

function isStatusField(col: ApiMetaColumn): boolean {
  return STATUS_HINTS.some((h) => col.secondary_code.toLowerCase().includes(h));
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TreeTableBuilderService {
  /**
   * Build a TreeTableResponse from a raw API / JSON response.
   *
   * Mirrors TableBuilderService.build() but understands the new tree format:
   *   result.items[]  → each item has { level, label, data, children, meta_data }
   *   children        → { data: TreeItemRaw[], meta_data: ApiMetaColumn[] }
   *
   * @example
   * map(res => this.treeBuilder.build(res, {
   *     itemsPath: 'result.items',
   *     metaPath:  'result.meta_data',
   *     titlePath: 'result.paging.page_title',
   * }))
   */
  build(raw: unknown, config: TreeTableBuilderConfig = {}): TreeTableResponse {
    const {
      excludedKeys = [],
      cellTypeMap = {},
      severityMaps = {},
      itemsPath = 'result.items',
      metaPath = 'result.meta_data',
      titlePath = 'result.paging.page_title',
      useEnglish = false
    } = config;

    const rawItems: TreeItemRaw[] =
      (resolvePath(raw, itemsPath) as TreeItemRaw[]) ?? [];
    const metaData: ApiMetaColumn[] =
      (resolvePath(raw, metaPath) as ApiMetaColumn[]) ?? [];
    const pageTitle: string = (resolvePath(raw, titlePath) as string) ?? '';

    const excluded = new Set(excludedKeys);

    const columns = this.buildColumns(
      metaData,
      excluded,
      cellTypeMap,
      severityMaps
    );

    const items = rawItems.map((item) =>
      this.processItem(item, excluded, cellTypeMap, severityMaps, useEnglish)
    );

    return { items, columns, pageTitle, rawMeta: metaData };
  }

  // ── Column builder ────────────────────────────────────────────────────────

  private buildColumns(
    meta: ApiMetaColumn[],
    excluded: Set<string>,
    cellTypeMap: Record<string, TreeTableColumn['cellType']>,
    severityMaps: Record<string, Record<string, any>>
  ): TreeTableColumn[] {
    if (!meta.length) return [];

    return meta
      .filter(
        (col) =>
          col.is_public !== -1 &&
          !INTERNAL_KEYS.has(col.secondary_code) &&
          !excluded.has(col.secondary_code)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((col) => this.metaToColumn(col, cellTypeMap, severityMaps));
  }

  private metaToColumn(
    col: ApiMetaColumn,
    cellTypeMap: Record<string, TreeTableColumn['cellType']>,
    severityMaps: Record<string, Record<string, any>>
  ): TreeTableColumn {
    const field = col.secondary_code;
    const isStatus = isStatusField(col);

    // Resolve cellType: explicit override → status hint → default undefined
    const cellType: TreeTableColumn['cellType'] =
      cellTypeMap[field] ?? (isStatus ? 'tag' : undefined);

    const column: TreeTableColumn = {
      field,
      header: col.name,
      columnId: `col-${field}`,
      sortable: true,
      filterable: col.is_public === 1
    };

    if (cellType) column.cellType = cellType;
    if (severityMaps[field]) column.severityMap = severityMaps[field];

    // Auto-link a *_color sibling as the severityField for tag cells
    if (cellType === 'tag' && !column.severityField) {
      column.severityField = field; // fallback to self; parent can override
    }

    return column;
  }

  // ── Item processor ────────────────────────────────────────────────────────

  private processItem(
    raw: TreeItemRaw,
    excluded: Set<string>,
    cellTypeMap: Record<string, TreeTableColumn['cellType']>,
    severityMaps: Record<string, Record<string, any>>,
    useEnglish: boolean
  ): TreeTableItem {
    const label = useEnglish ? (raw.label_en ?? raw.label) : raw.label;

    let children: TreeTableChildren | null = null;

    if (raw.children) {
      children = this.processChildren(
        raw.children,
        excluded,
        cellTypeMap,
        severityMaps,
        useEnglish
      );
    }

    return {
      level: raw.level,
      label,
      module: useEnglish ? (raw.module_en ?? raw.module) : raw.module,
      data: raw.data,
      children
    };
  }

  private processChildren(
    block: TreeChildrenBlock,
    excluded: Set<string>,
    cellTypeMap: Record<string, TreeTableColumn['cellType']>,
    severityMaps: Record<string, Record<string, any>>,
    useEnglish: boolean
  ): TreeTableChildren {
    const columns = this.buildColumns(
      block.meta_data,
      excluded,
      cellTypeMap,
      severityMaps
    );

    const data = block.data.map((child) =>
      this.processItem(child, excluded, cellTypeMap, severityMaps, useEnglish)
    );

    return { data, columns, rawMeta: block.meta_data };
  }

  // ── Utility: extract unique filter options from items ─────────────────────

  /**
   * Extract distinct values for a given field from processed items
   * (including children) — for toolbar / column filter dropdowns.
   *
   * @example
   * const moduleOpts = treeBuilder.uniqueFilterOptions(items, 'module');
   */
  uniqueFilterOptions(
    items: TreeTableItem[],
    field: 'module' | string
  ): { label: string; value: string }[] {
    const set = new Set<string>();

    const collect = (list: TreeTableItem[]) => {
      for (const item of list) {
        const val =
          field === 'module'
            ? (item.module ?? '')
            : String(item.data[field] ?? '');
        if (val) set.add(val);
        if (item.children?.data.length) collect(item.children.data);
      }
    };

    collect(items);
    return [...set].map((v) => ({ label: v, value: v }));
  }
}
