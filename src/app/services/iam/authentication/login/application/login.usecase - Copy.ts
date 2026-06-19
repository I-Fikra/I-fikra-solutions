import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AUTH_REPOSITORY } from '../domain/ports/auth.repository';
import { AuthCredentials, AuthToken } from '../domain/models/auth.model';
import { TokenStorageService } from '../infrastructure/token-storage.service';

@Injectable()
export class LoginUseCase {

    private readonly authRepo = inject(AUTH_REPOSITORY);
    private readonly tokenStorage = inject(TokenStorageService);

    execute(credentials: AuthCredentials): Observable<AuthToken> {
        return this.authRepo.login(credentials).pipe(
            tap(token => this.tokenStorage.save(token.accessToken, token.tokenType))
        );
    }
}