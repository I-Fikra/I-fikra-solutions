import {
    TableColumn,
    AdvancedFilterState,
    FilterRule
} from '../models/table.models';

/** Returns a stable unique id string for new table rows. */
export function generateRowId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Maps a column type to the PrimeNG filter-type string. */
export function resolveFilterType(col: TableColumn): string {
    switch (col.type) {
        case 'currency':
        case 'rating':
            return 'numeric';
        case 'date':
            return 'date';
        case 'boolean':
            return 'boolean';
        default:
            return col.filterType ?? 'text';
    }
}

/** Returns the default PrimeNG matchMode for a column. */
export function defaultMatchMode(col: TableColumn): string {
    const type = resolveFilterType(col);
    if (type === 'numeric' || type === 'boolean') return 'equals';
    if (type === 'date') return 'dateIs';
    return 'contains';
}

/** Creates a blank AdvancedFilterState for a column. */
export function emptyFilterState(col: TableColumn): AdvancedFilterState {
    return {
        operator: 'and',
        rules: [{ matchMode: defaultMatchMode(col), value: null }]
    };
}

/** Returns true when a filter rule value is non-empty. */
export function hasRuleValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
}

/** Coerces a rule value to the correct JS type for PrimeNG filtering. */
export function normalizeRuleValue(col: TableColumn, value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (['numeric', 'currency', 'rating'].includes(col.type ?? '')) {
        return typeof value === 'string' ? Number(value) : value;
    }
    if (col.type === 'date' && typeof value === 'string')
        return new Date(value);
    return value;
}

/** Extracts the id (string | number) from a row object, or null. */
export function getRowId(item: unknown): string | number | null {
    if (!item || typeof item !== 'object') return null;
    const id = (item as Record<string, unknown>)['id'];
    return typeof id === 'string' || typeof id === 'number' ? id : null;
}

/**
 * Builds a list of unique, sorted label/value pairs from an array of records.
 * @example uniqueOptions(roles, 'status')
 */
// table.utils.ts
export function uniqueOptions<T>(
    data: T[],
    field: keyof T
): { label: string; value: string }[] {
    return [
        ...new Set(
            data.map((item) => String(item[field] ?? '')).filter(Boolean)
        )
    ]
        .sort()
        .map((v) => ({ label: v, value: v }));
}
