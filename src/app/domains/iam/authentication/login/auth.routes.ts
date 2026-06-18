import { Routes } from '@angular/router';
import { AUTH_REPOSITORY } from './domain/ports/auth.repository';
import { AuthApiService } from './infrastructure/auth-api.service';
import { TokenStorageService } from './infrastructure/token-storage.service';
import { LoginUseCase } from './application/login.usecase';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./presentation/pages/login/login.page').then(m => m.LoginPage),
        providers: [
            { provide: AUTH_REPOSITORY, useClass: AuthApiService },
            TokenStorageService,
            LoginUseCase,
        ]
    }
];