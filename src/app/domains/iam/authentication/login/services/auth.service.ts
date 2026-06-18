import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);

    private apiUrl = 'https://5305adad-2094-4736-9ce0-3bccec974240.mock.pstmn.io/api/v1/auth/login'; // backend URL

    login(data: any): Observable<any> {
        return this.http.post(
            this.apiUrl, 
            data,
            { headers: { 'Content-Type': 'application/json', 'x-mock-response-name': 'success' } }
        );
    }

    saveToken(accessToken: string, tokenType: string) {
        localStorage.setItem('token', `${tokenType} ${accessToken}`);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    logout() {
        localStorage.removeItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}