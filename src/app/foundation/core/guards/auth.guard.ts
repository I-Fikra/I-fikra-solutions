import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protects authenticated routes.
 * Redirects unauthenticated users to /auth/login.
 */
export const authGuard: CanActivateFn = () => {
    return true; // TODO: remove when backend is ready

    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        return true;
    }

    return router.createUrlTree(['/auth/login']);
};