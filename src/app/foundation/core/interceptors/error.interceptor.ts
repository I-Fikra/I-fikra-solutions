import {
    HttpErrorResponse,
    HttpHandlerFn,
    HttpRequest
} from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';

/**
 * Global error interceptor.
 * - Retries transient network errors (5xx, 0) up to 2 times with exponential back-off.
 * - Rethrows so callers can handle specific errors if needed.
 *
 * ⚠️ FIX: MessageService removed — it's component-scoped, not root-scoped.
 *    Toasts should be handled in each component's error callback instead.
 */
export function errorInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) {
    return next(req).pipe(
        retry({
            count: 2,
            delay: (error: HttpErrorResponse, attempt) => {
                if (!isRetryable(error)) {
                    throwError(() => error);
                }
                return timer(500 * attempt);
            }
        }),
        catchError((err: HttpErrorResponse) => {
            return throwError(() => err);
        })
    );
}

function isRetryable(err: HttpErrorResponse): boolean {
    return err.status === 0 || err.status >= 500;
}