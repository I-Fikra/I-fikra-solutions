// ─── Column definition ────────────────────────────────────────────────────────

export interface TableColumn {
    field: string;
    header: string;
    type?:
        | 'text'
        | 'numeric'
        | 'date'
        | 'boolean'
        | 'status'
        | 'currency'
        | 'rating'
        | 'time';
    /** Secondary field rendered beneath the primary value */
    subField?: string;
    /** Optional PrimeIcons class displayed before the cell value, e.g. 'pi pi-tag' */
    icon?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'numeric' | 'date' | 'boolean' | 'between';
    width?: string;
    minWidth?: string;
    filterPlaceholder?: string;
    exportable?: boolean;
    exportHeader?: string;
    /** Pre-defined options rendered as checkboxes in the column-header popover */
    filterOptions?: LabelValue[];
    // to manage dymanic column and keep the name and status displayed first
    isPrimary?: boolean;
    isStatus?: boolean;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface ToolbarFilterDefinition {
    field: string;
    label: string;
    options: LabelValue[];
    matchMode?: 'in' | 'equals' | 'contains';
}

export interface AdvancedFilterState {
    operator: 'and' | 'or';
    rules: FilterRule[];
}

export interface FilterRule {
    matchMode: string;
    value: unknown;
}

// ─── Bottom bar actions ───────────────────────────────────────────────────────

export interface BottomBarAction {
    key: string;
    label: string;
    icon: string;
    severity?:
        | 'success'
        | 'info'
        | 'warn'
        | 'danger'
        | 'secondary'
        | 'contrast';
    tooltip?: string;
    destructive?: boolean;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

export interface LabelValue<T = string> {
    label: string;
    value: T;
}
