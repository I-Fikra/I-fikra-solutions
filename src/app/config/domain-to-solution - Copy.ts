/**
 * domain-to-solution.ts
 *
 * Pure function that converts the admin shell's DOMAINS array into a single
 * SolutionConfig — making the menu-building logic reusable by app.menu.ts
 * (Phase 5) and, later, by the injectable SOLUTION_CONFIG token (Phase 6).
 *
 * Why a separate file?
 *   - Keeps domain.config.ts as a pure data file (no logic).
 *   - Keeps app.menu.ts as a pure view component (no conversion logic).
 *   - The function is a plain pure function — easy to unit-test and reuse.
 */

import type { ProjectConfig } from '@/app/foundation/core/models';
import type { SolutionConfig, SolutionMenuItem } from '@/app/foundation/core/models/solution-config.model';
import { type DomainConfig } from './domain.config';

/**
 * Converts the admin shell's `DOMAINS` array into a single `SolutionConfig`.
 *
 * The conversion mirrors the exact logic that `app.menu.ts` already uses so
 * the rendered sidebar is structurally and visually identical before and after
 * Phase 5 wires this function in.
 *
 * @param domains        The `DOMAINS` array from `domain.config.ts`.
 * @param appName        Human-readable solution name (e.g. from ProjectConfigService).
 * @param availableProjects  Passed through to any `subModulesFactory` hooks.
 */
export function buildSolutionConfigFromDomains(
  domains: DomainConfig[],
  appName: string,
  availableProjects: ProjectConfig[] = []
): SolutionConfig {
  const menuItems: SolutionMenuItem[] = domains
    .filter((domain) => domain.enabled)
    .map((domain) => {
      const moduleItems: SolutionMenuItem[] = domain.modules
        .filter((mod) => mod.enabled)
        .map((mod) => {
          const subs = mod.subModulesFactory
            ? mod.subModulesFactory(availableProjects)
            : mod.subModules;
          const enabledSubs = subs.filter((s) => s.enabled);

          // Module without sub-modules → leaf item
          if (enabledSubs.length === 0) {
            return {
              label: mod.label,
              icon: mod.icon,
              routerLink: ['/' + mod.routePath]
            } satisfies SolutionMenuItem;
          }

          // Module with sub-modules → group item
          return {
            label: mod.label,
            icon: mod.icon,
            items: enabledSubs.map((sub) => ({
              label: sub.label,
              icon: sub.icon,
              routerLink: sub.routerLink
            }))
          } satisfies SolutionMenuItem;
        });

      return {
        label: domain.label,
        items: moduleItems
      } satisfies SolutionMenuItem;
    });

  return {
    key: 'default',
    appName,
    logoPath: '',
    menuItems
  };
}
