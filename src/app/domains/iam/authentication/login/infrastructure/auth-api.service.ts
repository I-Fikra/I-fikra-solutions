import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IAuthRepository } from '../domain/ports/auth.repository';
import { AuthCredentials, AuthToken } from '../domain/models/auth.model';

@Injectable()
export class AuthApiService implements IAuthRepository {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'https://5305adad-2094-4736-9ce0-3bccec974240.mock.pstmn.io/api/v1/auth/login';

    login(credentials: AuthCredentials): Observable<AuthToken> {
        return this.http.post<{ access_token: string; token_type: string }>(
            this.apiUrl,
            credentials,
            { headers: { 'Content-Type': 'application/json', 'x-mock-response-name': 'success' } }
        ).pipe(
            map(response => ({
                accessToken: response.access_token,
                tokenType: response.token_type
            }))
        );
    }
}