import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { SOLUTION_CONFIG } from '@/app/foundation/core/tokens/solution-config.token';

/**
 * platformGuard — Phase 8 scaffold.
 *
 * Reads the active SolutionConfig via inject(SOLUTION_CONFIG) and logs which
 * route was checked against which solution key. Always returns true for now —
 * no enforcement yet. This is infrastructure groundwork for future per-solution
 * route restrictions (Phase 9+).
 *
 * Applied to: 'sol' and 'builder' child routes only.
 * NOT applied to: 'auth', 'iam', 'dashboard' (per Phase 8 spec).
 */
export const platformGuard: CanActivateFn = (route) => {
  const solution = inject(SOLUTION_CONFIG);

  console.log(
    `[platformGuard] route="${route.routeConfig?.path ?? '(unknown)'}" ` +
    `solution="${solution.key}" — allowed (permissive)`
  );

  return true;
};
