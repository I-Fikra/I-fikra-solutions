export interface JiraFilterOption {
    label: string;
    value: string;
    /** Optional color dot (hex / CSS color) */
    color?: string;
    /** Optional PrimeIcons class, e.g. 'pi pi-circle-fill' */
    icon?: string;
}

export type JiraFilterOperator = 'equals' | 'not_equals' | 'contains';

export interface JiraFilterOperatorOption {
    label: string;
    value: JiraFilterOperator;
}