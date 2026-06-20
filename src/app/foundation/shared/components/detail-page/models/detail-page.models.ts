/**
 * detail-page.models.ts
 *
 * Shared models for the detail-page component library.
 * All label fields are optional — they come from API meta_data when available,
 * and fall back to transloco keys in the consuming component.
 */

import type { ButtonSeverity } from 'primeng/button';

// ── Metadata sidebar ──────────────────────────────────────────────────────────

export interface MetadataItem {
    /** Display label — from API meta_data.name, falls back to transloco */
    label?:       string;
    value:        string | null | undefined;
    wrap?:        boolean;
    muted?:       boolean;
    hideIfEmpty?: boolean;
}

// ── Timestamp sidebar ─────────────────────────────────────────────────────────

export interface TimestampEntry {
    /** Display label — from API meta_data.name, falls back to transloco */
    label?:   string;
    variant:  'send' | 'process' | 'receive';
    value:    Date | null | undefined;
}

// ── Attachment list ───────────────────────────────────────────────────────────

export interface AttachmentItem {
    name: string;
    size: string;
    url?: string;
}

// ── Process timeline ──────────────────────────────────────────────────────────

export interface ProcessStep {
    label:      string;
    done:       boolean;
    timestamp?: Date | null;
}

// ── Party card ────────────────────────────────────────────────────────────────

export interface PartyCardLabels {
    connectorId?: string;
    channelId?:   string;
    connector?:   string;
    channel?:     string;
}

export interface PartyCardData {
    name?:        string | null;
    id?:          number | string | null;
    connectorId?: number | string | null;
    channelId?:   number | string | null;
    connector?:   string | null;
    channel?:     string | null;
    /** Pre-translated field labels from API meta_data — override transloco fallbacks */
    labels?:      PartyCardLabels;
}

// ── Page header ───────────────────────────────────────────────────────────────

export interface BreadcrumbConfig {
    parentLabel?:  string;
    parentKey?:    string;
    currentLabel?: string;
    currentKey?:   string;
}

export interface PageHeaderAction {
    icon:        string;
    /** Pre-translated label from the API — takes precedence over labelKey */
    label?:      string;
    /** Transloco key — used as fallback when label is not provided */
    labelKey:    string;
    tooltipKey?: string;
    ariaLabel?:  string;
    outlined?:   boolean;
    action:      string;
    severity?:   ButtonSeverity;
}

// ── Validation messages (for metadata-sidebar) ────────────────────────────────

export interface ValidationMessage {
    labelKey?:  string;
    summary?:   string;
    detail:     string;
    life?:      number;
    sticky?:    boolean;
    closable?:  boolean;
}