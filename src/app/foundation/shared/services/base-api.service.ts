import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// ── Response status codes ─────────────────────────────────────────────────────
export enum ApiStatus {
    Success = 1,
    Warning = 2,
    Failed  = 0
}

// ── API message envelope ──────────────────────────────────────────────────────
export interface ApiMessage {
    type:  string;
    texts: string[];
}

// ── Paging envelope ───────────────────────────────────────────────────────────
export interface ApiPaging {
    page_title:    string;
    page_subtitle: string | null;
    total_items:   number;
    start_item:    number;
    end_item:      number;
    items_per_page: number;
    total_pages:   number;
    current_page:  number;
}

// ── Meta data column descriptor ───────────────────────────────────────────────
export interface ApiMetaColumn {
    secondary_code: string;
    name:           string;
    icon:           string | null;
    order:          number;
    type:           'NUMBER' | 'STRING' | 'DATE' | 'BOOLEAN' | string;
    is_public:      number;   // -1 = hidden, 0 = internal, 1 = visible
    enum:           any | null;
    lookup:         any | null;
}

// ── Paged result wrapper ──────────────────────────────────────────────────────
export interface ApiPagedResult<T = any> {
    paging:    ApiPaging;
    meta_data: ApiMetaColumn[];
    items:     T[];
}

// ── Standard API envelope ─────────────────────────────────────────────────────
export interface ApiResponse<R = any> {
    success:  number;
    messages: ApiMessage | string[] | null;
    result:   R;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function isSuccess(res: ApiResponse): boolean {
    return res.success === ApiStatus.Success;
}

export function isWarning(res: ApiResponse): boolean {
    return res.success > ApiStatus.Success;
}

export function isFailed(res: ApiResponse): boolean {
    return res.success < ApiStatus.Success;
}

function extractMessages(res: ApiResponse): string {
    const m = res.messages;
    if (!m) return 'Request failed';
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'object' && 'texts' in m) return (m as ApiMessage).texts?.join(' ') ?? 'Request failed';
    return String(m);
}

/**
 * BaseApiService — generic HTTP service
 *
 * ── Examples ──────────────────────────────────────────────────────────────────
 *
 *  // result هو array مباشرةً
 *  export class MessagesService extends BaseApiService<Message> {
 *      protected url = '/api/messages';
 *      protected mapItem(raw: any): Message { return { ... }; }
 *  }
 *
 *  // result فيه paging + meta_data + items
 *  export class VesselsService extends BaseApiService<Vessel> {
 *      protected url = 'http://192.168.1.39:5000/api/system/Vsl/Vessel';
 *      protected mapItem(raw: any): Vessel { return { ... }; }
 *  }
 * ──────────────────────────────────────────────────────────────────────────────
 */
export abstract class BaseApiService<T> {
    protected http = inject(HttpClient);

    protected abstract url: string;
    protected abstract mapItem(raw: any): T;

    /** آخر meta_data وصل من الـ API — متاح للـ components بعد أي getAll() */
    metaData: ApiMetaColumn[] = [];

    /** آخر paging وصل من الـ API — متاح للـ components بعد أي getAll() */
    paging: ApiPaging | null = null;

    /**
     * يدعم تلقائياً:
     *   - result.items       ← الـ structure الجديدة (paging + meta_data + items)
     *   - result as T[]      ← result هو array مباشرةً
     */
    protected getItems(result: any): any[] {
        if (result && typeof result === 'object' && Array.isArray(result.items)) {
            return result.items;
        }
        return Array.isArray(result) ? result : [];
    }

    /** يرجع الـ meta_data لو موجودة في الـ result */
    protected getMeta(result: any): ApiMetaColumn[] {
        if (result && typeof result === 'object' && Array.isArray(result.meta_data)) {
            return result.meta_data;
        }
        return [];
    }

    /** يرجع الـ paging لو موجودة في الـ result */
    protected getPaging(result: any): ApiPaging | null {
        if (result && typeof result === 'object' && result.paging) {
            return result.paging as ApiPaging;
        }
        return null;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    getAll(): Observable<T[]> {
        return this.http.get<ApiResponse>(this.url).pipe(
            map((res) => {
                if (isFailed(res)) throw new Error(extractMessages(res));
                // حفظ meta_data و paging بعد كل طلب ناجح
                this.metaData = this.getMeta(res.result);
                this.paging   = this.getPaging(res.result);
                return this.getItems(res.result).map((raw) => this.mapItem(raw));
            })
        );
    }

    getById(id: string | number): Observable<T> {
        return this.http.get<ApiResponse>(`${this.url}/${id}`).pipe(
            map((res) => {
                if (isFailed(res)) throw new Error(extractMessages(res));
                return this.mapItem(res.result);
            })
        );
    }
}