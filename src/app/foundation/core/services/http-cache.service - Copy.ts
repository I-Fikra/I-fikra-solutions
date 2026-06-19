import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

interface CacheEntry {
    response: HttpResponse<unknown>;
    expiresAt: number;
}

/**
 * In-memory HTTP cache shared between cacheInterceptor instances.
 * TTL defaults to 60 s — override per-call via the interceptor if needed.
 */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
    private readonly DEFAULT_TTL_MS = 60_000; // 60 seconds

    private readonly store = new Map<string, CacheEntry>();

    get(url: string): HttpResponse<unknown> | null {
        const entry = this.store.get(url);

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(url);

            return null;
        }

        return entry.response;
    }

    set(
        url: string,
        response: HttpResponse<unknown>,
        ttlMs = this.DEFAULT_TTL_MS
    ): void {
        this.store.set(url, {
            response,
            expiresAt: Date.now() + ttlMs
        });
    }

    invalidate(url: string): void {
        this.store.delete(url);
    }

    /** Remove all entries whose key starts with prefix */
    invalidateByPrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    clear(): void {
        this.store.clear();
    }
}