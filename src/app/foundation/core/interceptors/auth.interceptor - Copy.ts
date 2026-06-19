import {
    HttpErrorResponse,
    HttpHandlerFn,
    HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const SKIP_AUTH_PATTERNS = [
    '/auth/login',
    '/auth/refresh',
    '/assets/',
    '/i18n/'  // transloco translation files — no token needed
];

function isPublicUrl(url: string): boolean {
    return SKIP_AUTH_PATTERNS.some((pattern) => url.includes(pattern));
}

function addToken(
    req: HttpRequest<unknown>,
    token: string | null
): HttpRequest<unknown> {
    if (!token) return req;

    return req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    });
}

export function authInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) {
    const auth = inject(AuthService);

    if (isPublicUrl(req.url)) {
        return next(req);
    }

    const token = auth.accessToken();
    const authedReq = addToken(req, token);

    return next(authedReq).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status !== 401) {
                return throwError(() => err);
            }

            return auth.refreshToken().pipe(
                switchMap((newToken) => next(addToken(req, newToken))),
                catchError((refreshErr) => {
                    auth.logout();

                    return throwError(() => refreshErr);
                })
            );
        })
    );
}