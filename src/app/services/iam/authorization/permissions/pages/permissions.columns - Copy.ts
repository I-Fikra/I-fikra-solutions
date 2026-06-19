// ─── Column factory functions for the Permissions tree-table ─────────────────
// Headers and filter labels come entirely from the API translations object.
// No Transloco calls — no i18n files needed.

import { TreeTableColumn } from '@/app/foundation/shared/components/tree-table/tree-table';
import { FilterOption } from './permission.model';
import { PermissionsTranslations } from './permissions-data.service';

// ── Entity (parent row) columns ───────────────────────────────────────────────

export function buildEntityColumns(
  tr: PermissionsTranslations,
  catOpts: FilterOption[],
  statusOpts: FilterOption[]
): TreeTableColumn[] {
  return [
    {
      field: 'name',
      header: tr.entityName,
      columnId: 'entity-name',
      sortable: true,
      filterable: true,
      minWidth: '220px'
    },
    {
      field: 'category',
      header: tr.category,
      columnId: 'entity-cat',
      sortable: true,
      filterable: true,
      filterOptions: catOpts,
      minWidth: '160px'
    },
    {
      field: 'statusLabel',
      header: tr.status,
      columnId: 'entity-status',
      sortable: true,
      filterable: true,
      filterOptions: statusOpts,
      cellType: 'tag',
      severityField: 'status',
      severityMap: {
        Active: 'success',
        Pending: 'warn',
        Inactive: 'secondary'
      },
      minWidth: '130px'
    },
    {
      field: 'assignedRolesCount',
      header: tr.assignedRoles,
      columnId: 'entity-roles',
      sortable: true,
      filterable: false,
      minWidth: '140px'
    }
  ];
}

// ── Permission (child row) columns ────────────────────────────────────────────

export function buildPermissionColumns(
  tr: PermissionsTranslations,
  statusOpts: FilterOption[],
  actionOpts: FilterOption[]
): TreeTableColumn[] {
  return [
    {
      field: 'name',
      header: tr.permissionName,
      columnId: 'child-name',
      sortable: true,
      filterable: true,
      minWidth: '220px'
    },
    {
      field: 'statusLabel',
      header: tr.status,
      columnId: 'child-status',
      sortable: true,
      filterable: true,
      filterOptions: statusOpts,
      cellType: 'tag',
      severityField: 'status',
      severityMap: {
        Active: 'success',
        Pending: 'warn',
        Inactive: 'secondary'
      },
      minWidth: '130px'
    },
    {
      field: 'action',
      header: tr.actionType,
      columnId: 'child-action',
      sortable: true,
      filterable: true,
      filterOptions: actionOpts,
      minWidth: '140px'
    },
    {
      field: 'assignedRolesCount',
      header: tr.assignedRoles,
      columnId: 'child-roles',
      sortable: true,
      filterable: false,
      minWidth: '140px'
    }
  ];
}

// ── Field-permission (grandchild row) columns ─────────────────────────────────

export function buildFieldColumns(
  tr: PermissionsTranslations,
  statusOpts: FilterOption[]
): TreeTableColumn[] {
  return [
    {
      field: 'name',
      header: tr.fieldName,
      columnId: 'field-name',
      sortable: true,
      filterable: true,
      minWidth: '220px'
    },
    {
      field: 'statusLabel',
      header: tr.status,
      columnId: 'field-status',
      sortable: true,
      filterable: true,
      filterOptions: statusOpts,
      cellType: 'tag',
      severityField: 'status',
      severityMap: {
        Active: 'success',
        Pending: 'warn',
        Inactive: 'secondary'
      },
      minWidth: '130px'
    },
    {
      field: 'assignedRolesCount',
      header: tr.assignedRoles,
      columnId: 'field-roles',
      sortable: true,
      filterable: false,
      minWidth: '140px'
    }
  ];
}

// ── Filter-option builders ────────────────────────────────────────────────────

/**
 * Status options — value = English sentinel (for filtering against data.status),
 * label = translated string from the API translations object.
 */
export function buildStatusOptions(
  tr: PermissionsTranslations
): FilterOption[] {
  return (['Active', 'Inactive', 'Pending'] as const).map((s) => ({
    label: tr.statusLabels[s] ?? s,
    value: s
  }));
}

export function buildActionOptionsFromData(
  translatedActions: string[]
): FilterOption[] {
  return translatedActions.map((a) => ({ label: a, value: a }));
}

export function buildCategoryOptionsFromData(
  translatedCategories: string[]
): FilterOption[] {
  return translatedCategories.map((c) => ({ label: c, value: c }));
}
