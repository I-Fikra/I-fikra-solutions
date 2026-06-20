import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, merge, catchError } from 'rxjs';
import { map }                 from 'rxjs/operators';
import { TranslocoService }    from '@jsverse/transloco';

import {
    TreeTableBuilderService,
    TreeTableResponse,
    TreeTableBuilderConfig,
} from './tree-table-builder.service';

// ── Config ─────────────────────────────────────────────────────────────────────

export interface TreeDataPageConfig extends TreeTableBuilderConfig {
    /** Primary API endpoint */
    apiUrl: string;

    /** Optional JSON fallback used when the API fails or during development.
     *  Arabic version — loaded when lang === 'ar'. */
    fallbackJsonAr?: string;

    /** English JSON fallback — loaded when lang === 'en'. */
    fallbackJsonEn?: string;

    /** Reload when the active language changes (default: true) */
    reloadOnLangChange?: boolean;

    // ── TreeTableBuilderConfig fields (all optional) ─────────────────────────
    // excludedKeys, cellTypeMap, severityMaps, itemsPath, metaPath, titlePath,
    // useEnglish  →  inherited from TreeTableBuilderConfig
}

export const DEFAULT_TREE_CONFIG: Partial<TreeDataPageConfig> = {
    itemsPath:          'result.items',
    metaPath:           'result.meta_data',
    titlePath:          'result.paging.page_title',
    excludedKeys:       [],
    cellTypeMap:        {},
    severityMaps:       {},
    useEnglish:         false,
    reloadOnLangChange: true,
};

// ── Service ────────────────────────────────────────────────────────────────────

/**
 * GenericTreeTableService
 *
 * Fetches the new tree-format API and delegates to TreeTableBuilderService.
 * Mirrors GenericTableService but for tree pages.
 *
 * ── Usage in a component ──────────────────────────────────────────────────────
 *
 *   private readonly treeService = inject(GenericTreeTableService);
 *
 *   private load(): void {
 *       this.loading.set(true);
 *       this.treeService
 *           .getAll({
 *               apiUrl:        'http://api/categories',
 *               fallbackJsonAr: 'api/categories-ar.json',
 *               fallbackJsonEn: 'api/categories-en.json',
 *               cellTypeMap:   { category_status: 'tag' },
 *               severityMaps:  {
 *                   category_status: { Active: 'success', Inactive: 'secondary' }
 *               },
 *           })
 *           .pipe(take(1), finalize(() => this.loading.set(false)))
 *           .subscribe(({ items, columns, pageTitle, rawMeta }) => {
 *               this.items.set(items);
 *               this.columns.set(columns);
 *               this.pageTitle.set(pageTitle);
 *           });
 *   }
 * ──────────────────────────────────────────────────────────────────────────────
 */
@Injectable({ providedIn: 'root' })
export class GenericTreeTableService {

    private readonly http         = inject(HttpClient);
    private readonly t            = inject(TranslocoService);
    private readonly treeBuilder  = inject(TreeTableBuilderService);

    getAll(config: TreeDataPageConfig): Observable<TreeTableResponse> {
        const cfg  = { ...DEFAULT_TREE_CONFIG, ...config } as Required<TreeDataPageConfig>;
        const lang = this.t.getActiveLang();

        // Determine which language flag to pass to the builder
        const useEnglish = lang !== 'ar';

        const buildOptions: TreeTableBuilderConfig = {
            itemsPath:    cfg.itemsPath,
            metaPath:     cfg.metaPath,
            titlePath:    cfg.titlePath,
            excludedKeys: cfg.excludedKeys,
            cellTypeMap:  cfg.cellTypeMap,
            severityMaps: cfg.severityMaps,
            useEnglish,
        };

        // ── With fallback JSON ───────────────────────────────────────────────
        if (cfg.fallbackJsonAr || cfg.fallbackJsonEn) {
            const jsonFile = lang === 'ar'
                ? (cfg.fallbackJsonAr ?? cfg.fallbackJsonEn!)
                : (cfg.fallbackJsonEn ?? cfg.fallbackJsonAr!);

            const json$ = this.http.get<unknown>(jsonFile);
            const api$  = this.http.get<unknown>(cfg.apiUrl).pipe(catchError(() => json$));

            // Emit the local JSON first (fast), then replace with API response
            return merge(json$, api$).pipe(
                map(res => this.treeBuilder.build(res, buildOptions))
            );
        }

        // ── API only ─────────────────────────────────────────────────────────
        return this.http.get<unknown>(cfg.apiUrl).pipe(
            map(res => this.treeBuilder.build(res, buildOptions))
        );
    }
}