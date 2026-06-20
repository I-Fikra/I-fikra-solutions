// ══════════════════════════════════════════════════════
//  tree-table.models.ts
//  كل الـ interfaces والـ types الخاصة بالـ tree-table
// ══════════════════════════════════════════════════════

export interface Role {
  id: string;
  name: string;
  type: 'admin' | 'management' | 'content' | 'readonly' | 'audit' | 'support';
}

export interface TreeNodeData {
  code?: string;
  name: string;
  assignedRolesCount?: number;
  [key: string]: unknown;
}

export interface TreeNode {
  key: string;
  data: TreeNodeData;
  children?: TreeNode[];
}

export interface TreeModule {
  name: string;
  entities: TreeNode[];
}

export interface TreeTableColumn {
  field: string;
  columnId?: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  minWidth?: string;
  cellType?: 'tag' | 'code' | 'roles' | 'text' | 'org-name';
  translatePrefix?: string;
  valueMap?: Record<string, string>;
  severityMap?: Record<string, 'success' | 'warn' | 'secondary' | 'danger' | 'info'>;
  /** Optional: use a different field for severity lookup (e.g. 'status' when field is 'statusLabel') */
  severityField?: string;
  /**
   * Optional: read the display text from a different field on the node data,
   * instead of applying valueMap / translatePrefix to `field`.
   *
   * Example: field = 'status_id' (used for filtering/severity),
   *          displayField = 'status' (pre-localised string from API: "مفعل").
   * getCellDisplay() will return data['status'] directly, skipping translation.
   */
  displayField?: string;
  defaultMatchMode?: 'contains' | 'startsWith' | 'endsWith' | 'equals';
}

export interface NestedTableConfig {
  childKey?: string;
  columns: TreeTableColumn[];
  expandable?: boolean;
  nestedConfig?: NestedTableConfig;
  label?: string;
}

export interface TreeTableSortEvent {
  field: string;
  order: 1 | -1;
  level: 'entity' | 'child';
}

export interface TreeTableColFilterEvent {
  columnId: string;
  text?: { matchMode: string; value: string | null } | null;
  opts?: string[];
}

export interface PaginationConfig {
  rows: number;
  rowsPerPageOptions?: number[];
  totalRecords?: number;
  currentPage?: number;
}

// ── داخلية فقط (مش exported) ──────────────────────────
export interface ColFilterState {
  operator: 'and' | 'or';
  matchMode: string;
  value: string | null;
  selectedOptions: string[];
}

// Cache key لـ getCellDisplay memoization
export type CellCacheKey = string;