import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '@/environments/environment';

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  private readonly _user = signal<AuthUser | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly userRoles = computed(() => this._user()?.roles ?? []);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(credentials: {
    email: string;
    password: string;
  }): Observable<TokenPayload> {
    return this.http
      .post<TokenPayload>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((payload) => this.storeTokens(payload)));
  }

  // ── refreshToken — بسيط وصح: tap يحفظ + map يرجع الـ token ────────────
  refreshToken(): Observable<string> {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    return this.http
      .post<TokenPayload>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken: refresh
      })
      .pipe(
        tap((payload) => this.storeTokens(payload)),
        map((payload) => payload.accessToken)
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._accessToken.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  private storeTokens(payload: TokenPayload): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    this._accessToken.set(payload.accessToken);
  }
}
