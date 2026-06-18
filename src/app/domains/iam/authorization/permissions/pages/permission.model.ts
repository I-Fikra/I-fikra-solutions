// ─── Permission domain models ─────────────────────────────────────────────────

export type PermissionStatus = 'Active' | 'Inactive' | 'Pending';
export type PermissionAction = 'View' | 'Create' | 'Update' | 'Delete' | 'Export';

/**
 * Represents a single field-level permission (e.g. "View User Email").
 * These are leaf nodes nested under a View/Export permission.
 */
export interface FieldPermissionData {
  code:               string;
  name:               string;
  assignedRolesCount: number;
  status:             PermissionStatus;
  /** Marks this node as a field-level permission so the tree-table can render it differently if needed. */
  isFieldPermission:  true;
  [key: string]:      unknown;
}

export interface PermissionData {
  code:               string;
  name:               string;
  assignedRolesCount: number;
  status:             PermissionStatus;
  category:           string;
  action:             PermissionAction | string;
  /** True when this permission has nested field-level children. */
  hasFieldPermissions?: boolean;
  createdBy?:         string;
  createdAt?:         string;
  updatedBy?:         string;
  updatedAt?:         string;
  [key: string]:      unknown;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface RoleState {
  checked:       boolean;
  indeterminate: boolean;
}

export interface ActiveSort {
  field: string;
  order: 1 | -1;
  level: 'entity' | 'child';
}

export interface ActiveColFilters {
  entityName:   { matchMode: string; value: string | null } | null;
  entityCat:    string[];
  entityStatus: string[];
  childName:    { matchMode: string; value: string | null } | null;
  childStatus:  string[];
  childAction:  string[];
}

export const EMPTY_COL_FILTERS: ActiveColFilters = {
  entityName:   null,
  entityCat:    [],
  entityStatus: [],
  childName:    null,
  childStatus:  [],
  childAction:  [],
};

export const STATUS_SEVERITY_MAP: Record<string, 'success' | 'warn' | 'secondary'> = {
  Active:   'success',
  Pending:  'warn',
  Inactive: 'secondary',
};