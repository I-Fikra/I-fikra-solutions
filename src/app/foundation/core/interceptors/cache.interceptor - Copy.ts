import {
    HttpHandlerFn,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpCacheService } from '../services/http-cache.service';


const SKIP_CACHE_PATTERNS = [
    '/i18n/',   // translation files — Transloco manages its own caching
    '/auth/'    // auth endpoints — never cache tokens
];

function shouldSkip(url: string): boolean {
    return SKIP_CACHE_PATTERNS.some((p) => url.includes(p));
}

function resourcePrefix(url: string): string {
    const parts = url.split('/').filter(Boolean);

    return '/' + parts.slice(0, 2).join('/');
}

export function cacheInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) {
    const cache = inject(HttpCacheService);

    if (req.method !== 'GET') {
        cache.invalidateByPrefix(resourcePrefix(req.url));

        return next(req);
    }

    if (shouldSkip(req.url) || req.headers.has('X-Skip-Cache')) {
        const stripped = req.clone({
            headers: req.headers.delete('X-Skip-Cache')
        });

        return next(stripped);
    }

    const cached = cache.get(req.url);

    if (cached) {
        return of(cached.clone());
    }

    return next(req).pipe(
        tap((event) => {
            if (event instanceof HttpResponse && event.ok) {
                cache.set(req.url, event);
            }
        })
    );
}