/**
 * SolutionConfig — the typed shape of a generated platform/solution.
 *
 * SOURCE OF TRUTH:
 *   This is the central type for "what a generated solution looks like."
 *   It is NOT the sidebar config (see domain.config.ts → DOMAINS) and is NOT
 *   the branding model (see project-config.model.ts → ProjectConfig).
 *
 * - domain.config.ts    → defines the ADMIN SHELL's own sidebar structure.
 * - ProjectConfig       → runtime branding (app name, logo SVG, colors) per project.
 * - SolutionConfig      → what the Generator wizard produces: a named platform with
 *                         its own menu and branding, ready to be provisioned.
 *
 * Phase 4: type-only — not yet imported or used anywhere.
 * Phase 5: will be wired into app.menu.ts.
 * Phase 6: will be injectable via SOLUTION_CONFIG token.
 */

export interface SolutionConfig {
  /** Unique machine-readable key, e.g. 'hr-platform', 'erp-core'. */
  key: string;

  /** Human-readable name shown in the browser title and header. */
  appName: string;

  /** Path to the solution's logo asset, relative to /public. */
  logoPath: string;

  /** Optional primary brand color as a hex or rgb string, e.g. '#D94452'. */
  primaryColor?: string;

  /** Top-level menu structure for this solution's sidebar. */
  menuItems: SolutionMenuItem[];
}

export interface SolutionMenuItem {
  /** i18n key for the label, e.g. 'menu.dashboard'. */
  label: string;

  /** PrimeIcons class string, e.g. 'pi pi-fw pi-home'. */
  icon?: string;

  /** Router link array for leaf items, e.g. ['/dashboard']. */
  routerLink?: string[];

  /** Nested items for grouped/section menu entries. */
  items?: SolutionMenuItem[];
}
