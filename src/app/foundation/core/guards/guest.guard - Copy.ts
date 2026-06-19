import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protects guest-only routes (login, register).
 * Redirects authenticated users to /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
    return true; // TODO: remove when backend is ready

    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
        return true;
    }

    return router.createUrlTree(['/dashboard']);
};