/** PrimeNG match-mode option sets used by the advanced column filter popover.
 *  Labels are intentionally left in English here — they are re-translated at
 *  runtime via `shared.filterModes.<value>` keys in the table component.
 */

export const TEXT_MATCH_MODES = [
    { label: 'Contains', value: 'contains' },
    { label: 'Starts With', value: 'startsWith' },
    { label: 'Ends With', value: 'endsWith' },
    { label: 'Equals', value: 'equals' },
    { label: 'Not Equals', value: 'notEquals' }
] as const;

export const NUMERIC_MATCH_MODES = [
    { label: 'Equals', value: 'equals' },
    { label: 'Not Equals', value: 'notEquals' },
    { label: 'Less Than', value: 'lt' },
    { label: 'Less Or Equal', value: 'lte' },
    { label: 'Greater Than', value: 'gt' },
    { label: 'Greater Or Equal', value: 'gte' }
] as const;

export const DATE_MATCH_MODES = [
    { label: 'Date Is', value: 'dateIs' },
    { label: 'Date Is Not', value: 'dateIsNot' },
    { label: 'Date Before', value: 'dateBefore' },
    { label: 'Date After', value: 'dateAfter' }
] as const;

export const BOOLEAN_MATCH_MODES = [
    { label: 'Equals', value: 'equals' },
    { label: 'Not Equals', value: 'notEquals' }
] as const;
