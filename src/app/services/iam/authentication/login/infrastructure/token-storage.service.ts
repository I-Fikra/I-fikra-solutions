import { Injectable } from '@angular/core';

@Injectable()
export class TokenStorageService {

    private readonly KEY = 'token';

    save(accessToken: string, tokenType: string): void {
        localStorage.setItem(this.KEY, `${tokenType} ${accessToken}`);
    }

    get(): string | null {
        return localStorage.getItem(this.KEY);
    }

    clear(): void {
        localStorage.removeItem(this.KEY);
    }

    isValid(): boolean {
        return !!this.get();
    }
}