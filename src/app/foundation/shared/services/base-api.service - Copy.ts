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
    /**
     * Enum descriptor returned by the API for this column. Shape is
     * server-defined and varies per endpoint — consumers cast to the
     * specific shape they expect for a given column/endpoint.
     */
    enum:           unknown | null;
    /**
     * Lookup descriptor returned by the API for this column. Shape is
     * server-defined and varies per endpoint — consumers cast to the
     * specific shape they expect for a given column/endpoint.
     */
    lookup:         unknown | null;
}

// ── Paged result wrapper ──────────────────────────────────────────────────────
export interface ApiPagedResult<T = unknown> {
    paging:    ApiPaging;
    meta_data: ApiMetaColumn[];
    items:     T[];
}

// ── Standard API envelope ─────────────────────────────────────────────────────
export interface ApiResponse<R = unknown> {
    success:  number;
    messages: ApiMessage | string[] | null;
    result:   R;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when the API response indicates a successful operation. */
export function isSuccess(res: ApiResponse): boolean {
    return res.success === ApiStatus.Success;
}

/** Returns true when the API response indicates a warning (partial success). */
export function isWarning(res: ApiResponse): boolean {
    return res.success > ApiStatus.Success;
}

/** Returns true when the API response indicates a failure. */
export function isFailed(res: ApiResponse): boolean {
    return res.success < ApiStatus.Success;
}

/**
 * Extracts a human-readable error string from the server's own `messages`
 * field, falling back to a generic message only when the server sent none.
 *
 * @param res - The failed `ApiResponse`.
 * @returns The server's message text, or `'Request failed'` if absent.
 */
function extractMessages(res: ApiResponse): string {
    const m = res.messages;
    if (!m) return 'Request failed';
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'object' && 'texts' in m) return (m as ApiMessage).texts?.join(' ') ?? 'Request failed';
    return String(m);
}

/**
 * BaseApiService — generic HTTP service.
 *
 * Extend this class and implement `url` and `mapItem()` to get
 * typed `getAll()` and `getById()` methods for free.
 *
 * ── Examples ──────────────────────────────────────────────────────────────────
 *
 *  // result هو array مباشرةً
 *  export class MessagesService extends BaseApiService<Message> {
 *      protected url = '/api/messages';
 *      protected mapItem(raw: unknown): Message { return { ... }; }
 *  }
 *
 *  // result فيه paging + meta_data + items
 *  export class VesselsService extends BaseApiService<Vessel> {
 *      protected url = 'http://192.168.1.39:5000/api/system/Vsl/Vessel';
 *      protected mapItem(raw: unknown): Vessel { return { ... }; }
 *  }
 * ──────────────────────────────────────────────────────────────────────────────
 */
export abstract class BaseApiService<T> {
    protected http = inject(HttpClient);

    /** API endpoint URL — set in the concrete subclass. */
    protected abstract url: string;

    /**
     * Maps a raw server response item to the strongly-typed `T`. The
     * parameter is `unknown` because the server contract isn't verified
     * at compile time — cast to the expected shape inside the implementation.
     *
     * @param raw - Raw object from the API response.
     * @returns Mapped domain object of type `T`.
     */
    protected abstract mapItem(raw: unknown): T;

    /** آخر meta_data وصل من الـ API — متاح للـ components بعد أي getAll() */
    metaData: ApiMetaColumn[] = [];

    /** آخر paging وصل من الـ API — متاح للـ components بعد أي getAll() */
    paging: ApiPaging | null = null;

    /**
     * Extracts the items array from a raw API result.
     *
     * Supports two server response shapes automatically:
     *   - `result.items`  → the paginated structure (paging + meta_data + items)
     *   - `result as T[]` → result is a plain array
     *
     * @param result - The `result` field from an `ApiResponse`.
     * @returns Flat array of raw items, or `[]` if neither shape matches.
     */
    protected getItems(result: unknown): unknown[] {
        if (result && typeof result === 'object' && Array.isArray((result as Record<string, unknown>)['items'])) {
            return (result as ApiPagedResult)['items'];
        }
        return Array.isArray(result) ? result : [];
    }

    /**
     * Extracts meta_data columns from a raw API result, if present.
     *
     * @param result - The `result` field from an `ApiResponse`.
     * @returns Array of column descriptors, or `[]` if not present.
     */
    protected getMeta(result: unknown): ApiMetaColumn[] {
        if (result && typeof result === 'object' && Array.isArray((result as Record<string, unknown>)['meta_data'])) {
            return (result as ApiPagedResult)['meta_data'];
        }
        return [];
    }

    /**
     * Extracts paging info from a raw API result, if present.
     *
     * @param result - The `result` field from an `ApiResponse`.
     * @returns `ApiPaging` object, or `null` if not present.
     */
    protected getPaging(result: unknown): ApiPaging | null {
        if (result && typeof result === 'object' && (result as Record<string, unknown>)['paging']) {
            return (result as ApiPagedResult)['paging'];
        }
        return null;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Fetches all items from the configured endpoint.
     *
     * Side effect: updates `this.metaData` and `this.paging` after each
     * successful response.
     *
     * @returns Observable that emits the mapped `T[]` array.
     * @throws Error carrying the server's own message when the response indicates failure.
     */
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

    /**
     * Fetches a single item by its ID from the configured endpoint.
     *
     * @param id - Numeric or string identifier appended to the base URL.
     * @returns Observable that emits the mapped `T` object.
     * @throws Error carrying the server's own message when the response indicates failure.
     */
    getById(id: string | number): Observable<T> {
        return this.http.get<ApiResponse>(`${this.url}/${id}`).pipe(
            map((res) => {
                if (isFailed(res)) throw new Error(extractMessages(res));
                return this.mapItem(res.result);
            })
        );
    }
}
