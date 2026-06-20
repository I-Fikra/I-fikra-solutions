/**
 * payload-viewer.component.ts
 *
 * Reusable payload viewer — works for Messages, Schemas, or any generic object.
 *
 * Supports four view modes:
 *   'raw'      — formatted JSON pre block
 *   'segments' — EDI-style segments table  (payload has { segments: [...] })
 *   'fields'   — Schema fields table       (payload has { fields: [...] })
 *   'tree'     — Generic key-value tree    (any other object)
 *
 * viewType input:
 *   'auto' (default) — auto-detected from payload shape at render time
 *   'segments' | 'fields' | 'generic' — force a specific mode
 *
 * Usage — schema-details:
 *   <app-dp-payload-viewer [payload]="getSchemaPayload(s)" (copied)="onPayloadCopied()" />
 *
 * Usage — message-details:
 *   <app-dp-payload-viewer [payload]="message.payload" (copied)="onPayloadCopied()" />
 */

import {
    Component,
    ChangeDetectionStrategy,
    input,
    output,
    signal,
    computed,
    inject,
    effect,
} from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// ── Public types ──────────────────────────────────────────────────────────────

export interface PayloadSegmentRow {
    isGroup:      boolean;
    position:     string;
    segment:      string;
    name:         string;
    status:       string;
    maxUse:       string;
    description:  string;
    children:     PayloadSegmentRow[];
    collapsed:    boolean;
    groupLabel?:  string;
    groupRepeat?: string;
}

export interface SchemaFieldRow {
    name:         string;
    type:         string;
    required:     boolean;
    description:  string;
    example?:     unknown;
    validation?:  string;
    isGroup?:     boolean;
    groupLabel?:  string;
    children?:    SchemaFieldRow[];
}

export type PayloadViewType = 'segments' | 'fields' | 'generic' | 'auto';
export type ActiveView      = 'raw' | 'tree' | 'segments' | 'fields';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-dp-payload-viewer',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, JsonPipe, TooltipModule, TranslocoModule],
    templateUrl: './payload-viewer.component.html',
    styleUrl:    './payload-viewer.component.scss',
})
export class DpPayloadViewerComponent {

    // ── Inputs ────────────────────────────────────────────────────────────────

    /** The payload object to display. */
    payload = input<unknown>(null);

    /**
     * Hint for which tree-view to use.
     * 'auto' (default) detects from payload shape:
     *   has .segments[] → 'segments'
     *   has .fields[]   → 'fields'
     *   otherwise       → 'generic'
     */
    viewType = input<PayloadViewType>('auto');

    // ── Outputs ───────────────────────────────────────────────────────────────

    /** Emitted after a copy attempt (success or failure). */
    copied = output<void>();

    // ── Internal state ────────────────────────────────────────────────────────

    view            = signal<ActiveView>('tree');
    collapsedGroups = signal<Set<number>>(new Set());
    expandedFields  = signal<Set<string>>(new Set());

    /**
     * Tracks the last payload reference seen by the initialisation effect.
     * When the payload changes we reset the view to the default for that payload.
     * When only the user switches tabs (setView) the payload ref is the same,
     * so the effect is a no-op and the chosen view is preserved.
     */
    private _lastPayloadRef: unknown = undefined;

    private readonly t = inject(TranslocoService);

    // ── Reactive initialisation ───────────────────────────────────────────────
    // ngOnChanges does NOT fire for signal inputs in Angular 17+.
    // We use effect() that resets the view ONLY when the payload itself changes,
    // NOT when the user clicks a tab (setView).

    constructor() {
        effect(() => {
            const hint    = this.viewType();
            const payload = this.payload();

            // Only reset the active view when the payload reference changes,
            // i.e. a new schema was loaded. Tab-clicks must NOT trigger a reset.
            if (payload === this._lastPayloadRef) return;
            this._lastPayloadRef = payload;

            let defaultView: ActiveView;

            if (hint === 'segments') {
                defaultView = 'segments';
            } else if (hint === 'fields') {
                defaultView = 'fields';
            } else if (hint === 'generic') {
                defaultView = 'tree';
            } else {
                // auto — detect from payload shape
                const resolved = this._detect(payload);
                defaultView =
                    resolved === 'segments' ? 'segments' :
                    resolved === 'fields'   ? 'fields'   : 'tree';
            }

            this.view.set(defaultView);
            this.collapsedGroups.set(new Set());
            this.expandedFields.set(new Set());
        });
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    hasPayload = computed(() => {
        const p = this.payload();
        return p !== null && p !== undefined;
    });

    /**
     * Resolves the effective view type, running auto-detection when
     * viewType() === 'auto'.
     */
    resolvedViewType = computed((): 'segments' | 'fields' | 'generic' => {
        const hint = this.viewType();
        if (hint !== 'auto') return hint;
        return this._detect(this.payload());
    });

    // ── Private helpers ───────────────────────────────────────────────────────

    private _detect(p: unknown): 'segments' | 'fields' | 'generic' {
        if (!p || typeof p !== 'object') return 'generic';
        const rec = p as Record<string, unknown>;
        if (Array.isArray(rec['segments'])) return 'segments';
        if (Array.isArray(rec['fields']))   return 'fields';
        return 'generic';
    }

    // ── View controls ─────────────────────────────────────────────────────────

    setView(v: ActiveView): void {
        this.view.set(v);
    }

    // ── Copy ──────────────────────────────────────────────────────────────────

    copyPayload(): void {
        const p = this.payload();
        if (!p) return;
        navigator.clipboard
            .writeText(JSON.stringify(p, null, 2))
            .then(() => this.copied.emit())
            .catch(() => this.copied.emit());
    }

    // ── Segment table helpers ─────────────────────────────────────────────────

    toggleGroup(index: number): void {
        const next = new Set(this.collapsedGroups());
        next.has(index) ? next.delete(index) : next.add(index);
        this.collapsedGroups.set(next);
    }

    isGroupCollapsed(index: number): boolean {
        return this.collapsedGroups().has(index);
    }

    isRowVisible(rows: PayloadSegmentRow[], index: number): boolean {
        if (rows[index].isGroup) return true;
        for (let i = index - 1; i >= 0; i--) {
            if (rows[i].isGroup) return !this.collapsedGroups().has(i);
        }
        return true;
    }

    /** Returns the index of the group this row belongs to, or -1 if top-level */
    getRowGroupIndex(rows: PayloadSegmentRow[], index: number): number {
        for (let i = index - 1; i >= 0; i--) {
            if (rows[i].isGroup) return i;
        }
        return -1;
    }

    /** Groups segments into { index, row, children[] } blocks */
    getSegmentGroups(rows: PayloadSegmentRow[]): { index: number; row: PayloadSegmentRow; children: PayloadSegmentRow[] }[] {
        const groups: { index: number; row: PayloadSegmentRow; children: PayloadSegmentRow[] }[] = [];
        let current: { index: number; row: PayloadSegmentRow; children: PayloadSegmentRow[] } | null = null;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].isGroup) {
                current = { index: i, row: rows[i], children: [] };
                groups.push(current);
            } else if (current) {
                current.children.push(rows[i]);
            }
        }
        return groups;
    }

    getPayloadSegments(payload: unknown): PayloadSegmentRow[] {
        if (!payload || typeof payload !== 'object') return [];

        const rows: PayloadSegmentRow[] = [];

        const searchSegments = (obj: unknown): Record<string, unknown>[] | null => {
            if (!obj || typeof obj !== 'object') return null;

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = searchSegments(item);
                    if (found && found.length > 0) return found;
                }
                return null;
            }

            const rec = obj as Record<string, unknown>;

            if (Array.isArray(rec['segments'])) {
                return rec['segments'] as Record<string, unknown>[];
            }

            if (Array.isArray(rec['fields'])) {
                return this._convertFieldsToSegments(rec['fields'] as Record<string, unknown>[]);
            }

            for (const value of Object.values(rec)) {
                const found = searchSegments(value);
                if (found && found.length > 0) return found;
            }

            return null;
        };

        const segments = searchSegments(payload);
        if (!segments || segments.length === 0) return [];

        this._flattenSegments(segments, rows);
        return rows;
    }

    private _convertFieldsToSegments(
        fields: Record<string, unknown>[],
    ): Record<string, unknown>[] {
        return (fields || []).map((field, idx) => {
            const fieldType    = field['type'] as string;
            const hasProperties = fieldType === 'object' && Array.isArray(field['properties']);
            const hasItems      = fieldType === 'array'  && field['items'] != null;

            if (hasProperties) {
                return {
                    group:    true,
                    label:    String(field['name'] ?? `Group ${idx + 1}`),
                    repeat:   String(field['maxUse'] ?? '1'),
                    segments: this._convertFieldsToSegments(
                        field['properties'] as Record<string, unknown>[],
                    ),
                };
            }

            if (hasItems) {
                const items = field['items'] as Record<string, unknown>;
                return {
                    group:    true,
                    label:    String(field['name'] ?? `Array ${idx + 1}`),
                    repeat:   String(field['maxUse'] ?? '1'),
                    segments: this._convertFieldsToSegments([items]),
                };
            }

            return {
                position:    String(field['position'] ?? String((idx + 1) * 10).padStart(5, '0')),
                segment:     String(field['name'] ?? 'FIELD').toUpperCase(),
                name:        String(field['name'] ?? ''),
                mandatory:   field['required'] === true,
                maxUse:      field['maxUse'] ?? 1,
                description: String(field['description'] ?? ''),
            };
        });
    }

    private _flattenSegments(
        items: Record<string, unknown>[],
        out:   PayloadSegmentRow[],
    ): void {
        items.forEach((item, idx) => {
            const hasNested = Array.isArray(item['segments']) &&
                              (item['segments'] as unknown[]).length > 0;
            const isGroup   = item['group'] === true || hasNested;

            if (isGroup) {
                out.push({
                    isGroup:     true,
                    position:    '',
                    segment:     '',
                    name:        '',
                    status:      '',
                    maxUse:      '',
                    description: '',
                    children:    [],
                    collapsed:   false,
                    groupLabel:  String(item['label'] ?? item['name'] ?? `Group ${idx + 1}`),
                    groupRepeat: item['repeat'] != null ? String(item['repeat']) : undefined,
                });
                if (hasNested) {
                    this._flattenSegments(
                        item['segments'] as Record<string, unknown>[],
                        out,
                    );
                }
                return;
            }

            out.push({
                isGroup:     false,
                position:    String(item['position'] ?? String((idx + 1) * 10).padStart(5, '0')),
                segment:     String(item['segment']  ?? item['code']  ?? ''),
                name:        String(item['name']     ?? item['label'] ?? ''),
                status:      item['mandatory'] === true || item['status'] === 'Mandatory'
                                 ? 'Mandatory'
                                 : 'Conditional',
                maxUse:      item['maxUse'] != null ? `Max ${item['maxUse']}` : 'Max 1',
                description: String(item['description'] ?? ''),
                children:    [],
                collapsed:   false,
            });
        });
    }

    // ── Fields table helpers ──────────────────────────────────────────────────

    toggleField(name: string): void {
        const next = new Set(this.expandedFields());
        next.has(name) ? next.delete(name) : next.add(name);
        this.expandedFields.set(next);
    }

    isFieldExpanded(name: string): boolean {
        return this.expandedFields().has(name);
    }

    getSchemaFieldsTree(payload: unknown): SchemaFieldRow[] {
        if (!payload || typeof payload !== 'object') return [];
        const p = payload as Record<string, unknown>;
        if (!Array.isArray(p['fields'])) return [];

        return (p['fields'] as Record<string, unknown>[]).map(f => {
            const hasNested = f['type'] === 'object' && Array.isArray(f['properties']);
            return {
                name:        String(f['name']        ?? ''),
                type:        String(f['type']        ?? ''),
                required:    Boolean(f['required']),
                description: String(f['description'] ?? ''),
                example:     f['example'],
                validation:  f['validation'] != null ? String(f['validation']) : undefined,
                isGroup:     hasNested,
                groupLabel:  hasNested ? `${f['name']} (object)` : undefined,
                children:    hasNested
                                 ? this._mapNestedFields(
                                       f['properties'] as Record<string, unknown>[],
                                   )
                                 : [],
            };
        });
    }

    private _mapNestedFields(
        props: Record<string, unknown>[],
    ): SchemaFieldRow[] {
        if (!Array.isArray(props)) return [];
        return props.map(p => ({
            name:        String(p['name']        ?? ''),
            type:        String(p['type']        ?? ''),
            required:    Boolean(p['required']),
            description: String(p['description'] ?? ''),
            example:     p['example'],
            isGroup:     p['type'] === 'object' && Array.isArray(p['properties']),
            children:    p['type'] === 'object' && Array.isArray(p['properties'])
                             ? this._mapNestedFields(
                                   p['properties'] as Record<string, unknown>[],
                               )
                             : [],
        }));
    }

    // ── Generic tree helper ───────────────────────────────────────────────────

    getPayloadTree(
        payload: unknown,
    ): { key: string; value: string; depth: number }[] {
        const rows: { key: string; value: string; depth: number }[] = [];

        const flatten = (obj: unknown, prefix: string, depth: number): void => {
            if (obj === null || obj === undefined) return;

            if (typeof obj !== 'object' || Array.isArray(obj)) {
                rows.push({
                    key:   prefix,
                    value: Array.isArray(obj) ? JSON.stringify(obj) : String(obj),
                    depth,
                });
                return;
            }

            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
                const fullKey = prefix ? `${prefix}.${k}` : k;
                if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                    rows.push({ key: fullKey, value: '', depth });
                    flatten(v, fullKey, depth + 1);
                } else {
                    rows.push({
                        key:   fullKey,
                        value: v == null
                                   ? '—'
                                   : Array.isArray(v)
                                       ? JSON.stringify(v)
                                       : String(v),
                        depth,
                    });
                }
            }
        };

        flatten(payload, '', 0);
        return rows;
    }
}