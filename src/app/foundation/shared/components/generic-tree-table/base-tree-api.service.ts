import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
    ApiStatus,
    ApiMessage,
    ApiPaging,
    ApiMetaColumn,
    ApiResponse,
    isFailed,
} from '../../services/base-api.service';   // ← re-use the shared envelopes

// ── Re-export so consumers only need one import ────────────────────────────────
// FIX: use 'export type' for interfaces/types when isolatedModules is enabled
export { ApiStatus };
export type { ApiPaging, ApiMetaColumn };

// ── New-format item shapes ─────────────────────────────────────────────────────

/**
 * Children block inside a tree item.
 * `data`      → child items (same TreeItemRaw shape, level + 1)
 * `meta_data` → column definitions for the children table
 */
export interface TreeChildrenBlock {
    data:      TreeItemRaw[];
    meta_data: ApiMetaColumn[];
}

/**
 * One row in result.items — mirrors the structure built by the Python script:
 *
 *   {
 *     level:      1,
 *     label:      "اسم عربي",
 *     label_en:   "English name",
 *     module?:    "...",          // categories & permissions only
 *     module_en?: "...",
 *     data:       { ... },        // entity payload
 *     children:   { data: [...], meta_data: [...] } | null,
 *     meta_data:  [ ... ]         // entity-level column definitions
 *   }
 */
export interface TreeItemRaw {
    level:        number;
    label:        string;
    label_en?:    string;
    module?:      string;
    module_en?:   string;
    module_code?: string;
    data:         Record<string, unknown>;
    children:     TreeChildrenBlock | null;
    meta_data:    ApiMetaColumn[];
}

/**
 * result shape for the new tree-style API
 */
export interface TreePagedResult {
    paging:    ApiPaging;
    meta_data: ApiMetaColumn[];
    items:     TreeItemRaw[];
}

/**
 * What BaseTreeApiService.getAll() returns after mapping
 */
export interface TreeApiResult<T = TreeItemRaw> {
    items:    T[];
    metaData: ApiMetaColumn[];   // entity-level meta
    paging:   ApiPaging | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMessages(res: ApiResponse): string {
    const m = res.messages;
    if (!m) return 'Request failed';
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'object' && 'texts' in m) return (m as ApiMessage).texts?.join(' ') ?? 'Request failed';
    return String(m);
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * BaseTreeApiService
 *
 * Generic HTTP service for the **new tree-structure** APIs
 * (categories, organizations, permissions, …).
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *   // Simplest — use raw TreeItemRaw with no extra mapping:
 *   @Injectable({ providedIn: 'root' })
 *   export class CategoriesApiService extends BaseTreeApiService {
 *       protected url = 'api/categories-ar.json';
 *   }
 *
 *   // With a domain model:
 *   @Injectable({ providedIn: 'root' })
 *   export class PermissionsApiService extends BaseTreeApiService<PermissionEntity> {
 *       protected url = 'api/permissions-ar.json';
 *       protected override mapItem(raw: TreeItemRaw): PermissionEntity {
 *           return { ...raw, icon: resolveIcon(raw.data['perm_code'] as string) };
 *       }
 *   }
 * ──────────────────────────────────────────────────────────────────────────────
 */
export abstract class BaseTreeApiService<T = TreeItemRaw> {

    protected readonly http = inject(HttpClient);

    /** Override with the API / JSON endpoint */
    protected abstract url: string;

    /**
     * Override to transform a raw item into your domain type.
     * Default implementation returns the raw item as-is.
     */
    protected mapItem(raw: TreeItemRaw): T {
        return raw as unknown as T;
    }

    /** Last meta_data received — accessible to components after getAll() */
    metaData: ApiMetaColumn[] = [];

    /** Last paging received */
    paging: ApiPaging | null = null;

    // ── Public API ────────────────────────────────────────────────────────────

    getAll(): Observable<TreeApiResult<T>> {
        return this.http.get<ApiResponse<TreePagedResult>>(this.url).pipe(
            map(res => {
                if (isFailed(res)) throw new Error(extractMessages(res));

                const result = res.result;

                // cache for components
                this.metaData = result?.meta_data ?? [];
                this.paging   = result?.paging    ?? null;

                const items = (result?.items ?? []).map(raw => this.mapItem(raw));

                return {
                    items,
                    metaData: this.metaData,
                    paging:   this.paging,
                };
            })
        );
    }

    getById(id: string | number): Observable<T> {
        return this.http.get<ApiResponse<TreeItemRaw>>(`${this.url}/${id}`).pipe(
            map(res => {
                if (isFailed(res)) throw new Error(extractMessages(res));
                return this.mapItem(res.result);
            })
        );
    }
}