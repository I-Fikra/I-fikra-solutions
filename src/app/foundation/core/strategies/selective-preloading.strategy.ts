import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Preloads only routes that have `data: { preload: true }`.
 * Adds a small delay so the initial bundle isn't blocked.
 *
 * Usage in route config:
 *   { path: 'dashboard', loadChildren: ..., data: { preload: true } }
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
        if (route.data?.['preload'] !== true) {
            return of(null);
        }

        // Delay preload by 300 ms so critical path isn't affected
        return timer(300).pipe(mergeMap(() => load()));
    }
}