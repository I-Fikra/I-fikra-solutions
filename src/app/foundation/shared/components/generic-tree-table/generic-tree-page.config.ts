// ── Actions config ─────────────────────────────────────────────────────────────
export interface TreePageActions {
    /** إضافة entity جديدة (level 1) */
    createEntity?:   boolean;
    /** إضافة child جديد (level 2) */
    createChild?:    boolean;
    /** تعديل entity */
    editEntity?:     boolean;
    /** تعديل child */
    editChild?:      boolean;
    /** عرض entity */
    viewEntity?:     boolean;
    /** حذف entity */
    deleteEntity?:   boolean;
    /** حذف child */
    deleteChild?:    boolean;
}

// ── Extra row action ───────────────────────────────────────────────────────────
export interface TreeExtraRowAction {
    labelKey?:   string;
    icon?:       string;
    routerLink?: unknown[];
    command?:    (item: Record<string, unknown>, level: number) => void;
    separator?:  boolean;
    /** 'entity' | 'child' | 'both' — on which level to show the action */
    showOn?:     'entity' | 'child' | 'both';
}

// ── Main config ────────────────────────────────────────────────────────────────
export interface TreeDataTablePageConfig {
    /** Primary API endpoint */
    apiUrl: string;

    /** JSON fallback (Arabic) */
    fallbackJsonAr?: string;

    /** JSON fallback (English) */
    fallbackJsonEn?: string;

    /** Field used as the unique key for entity rows — default: auto from meta */
    entityIdField?: string;

    /** Field used as the unique key for child rows — default: auto from meta */
    childIdField?:  string;

    /** Entity name for toast messages */
    entityName?:    string;

    /** CRUD actions to expose */
    actions?: TreePageActions;

    /** Extra actions in entity / child row menus */
    extraRowActions?: TreeExtraRowAction[];

    /** secondary_codes to hide from tables and forms */
    excludedKeys?: string[];

    /** Override cellType per secondary_code */
    cellTypeMap?: Record<string, 'tag' | 'code' | 'text'>;

    /** Severity maps for tag cells */
    severityMaps?: Record<string, Record<string, 'success' | 'warn' | 'secondary' | 'danger' | 'info'>>;

    /** Group entity rows by module heading (default: true) */
    groupByModule?: boolean;

    /** Reload when language changes (default: true) */
    reloadOnLangChange?: boolean;

    /** TableBuilder paths — defaults cover the new tree JSON format */
    itemsPath?: string;
    metaPath?:  string;
    titlePath?: string;
}

// ── Defaults ───────────────────────────────────────────────────────────────────
export const DEFAULT_TREE_PAGE_CONFIG: Partial<TreeDataTablePageConfig> = {
    actions: {
        createEntity:  true,
        createChild:   true,
        editEntity:    true,
        editChild:     true,
        viewEntity:    true,
        deleteEntity:  true,
        deleteChild:   true,
    },
    excludedKeys:       [],
    cellTypeMap:        {},
    severityMaps:       {},
    groupByModule:      true,
    reloadOnLangChange: true,
    itemsPath:          'result.items',
    metaPath:           'result.meta_data',
    titlePath:          'result.paging.page_title',
};