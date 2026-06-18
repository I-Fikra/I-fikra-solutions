import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthCredentials, AuthToken } from '../models/auth.model';

export interface IAuthRepository {
    login(credentials: AuthCredentials): Observable<AuthToken>;
}

export const AUTH_REPOSITORY = new InjectionToken<IAuthRepository>('AUTH_REPOSITORY');