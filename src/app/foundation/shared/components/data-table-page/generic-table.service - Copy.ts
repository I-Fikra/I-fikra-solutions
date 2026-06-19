import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, merge, catchError, finalize, timeout } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import {
  TableBuilderService,
  TableResponse
} from '@/app/foundation/shared/services/table-builder.service';
import {
  DataTablePageConfig,
  DEFAULT_CONFIG
} from './generic-table-page.config';
import { PageLoadingService } from '@/app/foundation/shared/components/loading/page-loading.service';

export type { TableResponse as TableResponseWithSource };

@Injectable({ providedIn: 'root' })
export class GenericTableService {
  private readonly http = inject(HttpClient);
  private readonly t = inject(TranslocoService);
  private readonly tableBuilder = inject(TableBuilderService);
  private readonly pageLoading = inject(PageLoadingService);

  getAll(config: DataTablePageConfig): Observable<TableResponse> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const lang = this.t.getActiveLang();

    const buildOptions = {
      itemsPath: cfg.itemsPath!,
      metaPath: cfg.metaPath!,
      titlePath: cfg.titlePath!,
      excludedKeys: cfg.excludedKeys ?? [],
      columnTypeMap: cfg.columnTypeMap ?? {}
    };

    this.pageLoading.show();

    // ── بدون fallback JSON → API مباشرة ──────────────────────────────────────
    if (!cfg.fallbackJsonAr && !cfg.fallbackJsonEn) {
      return this.http.get<any>(cfg.apiUrl).pipe(
        map((res) => this.tableBuilder.build(res, buildOptions)),
        finalize(() => this.pageLoading.hide())
      );
    }

    // ── مع fallback JSON ──────────────────────────────────────────────────────
    const jsonFile =
      lang === 'ar'
        ? (cfg.fallbackJsonAr ?? cfg.fallbackJsonEn!)
        : (cfg.fallbackJsonEn ?? cfg.fallbackJsonAr!);

    // emit 1: JSON فوراً
    const json$ = this.http
      .get<any>(jsonFile)
      .pipe(map((res) => this.tableBuilder.build(res, buildOptions)));

    // emit 2: API في الـ background — بيـ timeout بعد 8 ثواني لو مفيش رد
    // لو فشل أو timeout → null يتفلتر، الـ JSON يفضل ظاهر
    const api$ = this.http.get<any>(cfg.apiUrl).pipe(
      timeout(1500),
      map((res) => this.tableBuilder.build(res, buildOptions)),
      catchError(() => of(null))
    );

    return merge(json$, api$).pipe(
      filter((res): res is TableResponse => res !== null),
      finalize(() => this.pageLoading.hide())
    );
  }
}
