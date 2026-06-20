/**
 * theme-configuration.store.ts
 *
 * Single Signal-based store for the entire ThemeConfiguration.
 * Responsibilities:
 *   - Hold the active ThemeConfiguration in a writable signal
 *   - Expose per-section computed slices (shape, button, dialog, …)
 *   - Apply ALL CSS custom properties to document.documentElement on every change
 *   - Persist to / hydrate from localStorage
 *   - Expose applyNow() so app.layout can eagerly push CSS vars on startup
 *     even before any signal changes (avoids flash of un-styled components)
 */

import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  type ThemeConfiguration,
  type ShapeConfig,
  type FontConfig,
  type ButtonConfig,
  type DialogConfig,
  type TableConfig,
  type TopbarConfig,
  type SidebarConfig,
  type LoginConfig,
  DEFAULT_THEME_CONFIGURATION,
  SHAPE_RADIUS_MAP,
  BTN_RADIUS_MAP,
  CARD_RADIUS_MAP,
  DIALOG_RADIUS_MAP,
  type TableRowSeparator,
  type TableHeaderStyle,
  type ButtonShadow,
  type ButtonSize,
  type DialogHeaderHeight,
  type DialogOverlay,
  type TopbarHeight,
  type TopbarBorder,
  type SidebarWidth,
  type FontEntry,
} from './theme-configuration.model';

// ── CSS variable maps ─────────────────────────────────────────────────────────

const TABLE_ROW_SEP_MAP: Record<TableRowSeparator, string> = {
  none:    'none',
  thin:    '1px solid var(--surface-border)',
  thick:   '2px solid var(--surface-border)',
  colored: '1px solid var(--primary-color)',
};

const TABLE_HEADER_BG_MAP: Record<TableHeaderStyle, string> = {
  filled:   'var(--surface-ground)',
  gradient: 'linear-gradient(90deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #8b5cf6))',
  minimal:  'transparent',
};

const BTN_SHADOW_MAP: Record<ButtonShadow, string> = {
  none:   'none',
  soft:   '0 2px 8px rgba(0,0,0,0.12)',
  lifted: '0 4px 16px rgba(0,0,0,0.2)',
};

const BTN_SIZE_MAP: Record<ButtonSize, string> = {
  sm: '0.35rem 0.85rem',
  md: '0.5rem 1.25rem',
  lg: '0.7rem 1.75rem',
};

const DIALOG_HEADER_H_MAP: Record<DialogHeaderHeight, string> = {
  compact: '40px',
  normal:  '56px',
  tall:    '72px',
};

const DIALOG_OVERLAY_MAP: Record<DialogOverlay, string> = {
  light:  '0.3',
  medium: '0.5',
  dark:   '0.75',
};

const TOPBAR_H_MAP: Record<TopbarHeight, string> = {
  compact: '48px',
  normal:  '64px',
  tall:    '80px',
};

const SIDEBAR_W_MAP: Record<SidebarWidth, string> = {
  narrow: '200px',
  normal: '240px',
  wide:   '280px',
};

const LANG_CSS_VAR: Record<string, string> = {
  'English / Latin': '--app-font-latin',
  'Arabic':          '--app-font-arabic',
  'Chinese':         '--app-font-chinese',
  'Japanese':        '--app-font-japanese',
  'Korean':          '--app-font-korean',
  'Greek':           '--app-font-greek',
  'Cyrillic':        '--app-font-cyrillic',
  'Custom':          '--app-font-custom',
};

const STORAGE_KEY = 'app_theme_configuration';

// ── Card style CSS var maps ───────────────────────────────────────────────────

const CARD_SHADOW_MAP: Record<string, string> = {
  elevated: '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
  bordered: 'none',
  flat:     'none',
  glass:    '0 8px 32px rgba(0,0,0,0.10)',
};

const CARD_BORDER_MAP: Record<string, string> = {
  elevated: '1px solid var(--surface-border)',
  bordered: '2px solid var(--surface-border)',
  flat:     'none',
  glass:    '1px solid rgba(255,255,255,0.25)',
};

const CARD_BG_MAP: Record<string, string> = {
  elevated: 'var(--surface-card)',
  bordered: 'var(--surface-card)',
  flat:     'var(--surface-ground)',
  glass:    'rgba(255,255,255,0.15)',
};

// ── Dialog style CSS var maps ─────────────────────────────────────────────────

const DIALOG_HEADER_BG_MAP: Record<string, string> = {
  'flat':            'var(--surface-card)',
  'accent-header':   'var(--primary-color)',
  'gradient-header': 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 60%, #8b5cf6))',
  'outlined':        'var(--surface-card)',
  'popup':           'var(--surface-card)',
};

const DIALOG_HEADER_COLOR_MAP: Record<string, string> = {
  'flat':            'var(--text-color)',
  'accent-header':   '#ffffff',
  'gradient-header': '#ffffff',
  'outlined':        'var(--text-color)',
  'popup':           'var(--text-color)',
};

// ── Store ─────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ThemeConfigurationStore {
  private readonly platformId = inject(PLATFORM_ID);

  // ── State ──────────────────────────────────────────────────────────────────
  private readonly _state = signal<ThemeConfiguration>(this._load());

  // ── Per-section computed slices ────────────────────────────────────────────
  readonly shape   = computed<ShapeConfig>(  () => this._state().shape);
  readonly font    = computed<FontConfig>(   () => this._state().font);
  readonly button  = computed<ButtonConfig>( () => this._state().button);
  readonly dialog  = computed<DialogConfig>( () => this._state().dialog);
  readonly table   = computed<TableConfig>(  () => this._state().table);
  readonly topbar  = computed<TopbarConfig>( () => this._state().topbar);
  readonly sidebar = computed<SidebarConfig>(() => this._state().sidebar);
  readonly login   = computed<LoginConfig>(  () => this._state().login);

  /** Full snapshot — useful for serialisation / demo sync */
  readonly snapshot = computed<ThemeConfiguration>(() => this._state());

  // ── Flat convenience signals used by shared components ─────────────────────
  readonly cardStyle    = computed(() => this._state().shape.cardStyle);
  readonly tableStyle   = computed(() => this._state().table.style);
  readonly dialogStyle  = computed(() => this._state().dialog.style);
  readonly buttonSize   = computed(() => this._state().button.size);
  readonly buttonShadow = computed(() => this._state().button.shadow);
  readonly globalShape  = computed(() => this._state().shape.globalShape);

  constructor() {
    // Apply CSS vars + persist on every state change (fires immediately on init too)
    effect(() => {
      const cfg = this._state();
      if (isPlatformBrowser(this.platformId)) {
        this._applyCssVars(cfg);
        this._persist(cfg);
      }
    });
  }

  // ── Public: eager apply (call from app.layout on startup) ─────────────────

  /**
   * Push all CSS variables to document.documentElement immediately.
   * Call this from app.layout's constructor (before Angular's first CD cycle)
   * to avoid a flash of un-styled components on page load.
   */
  applyNow(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._applyCssVars(this._state());
    }
  }

  /**
   * Reset everything to defaults AND re-apply immediately.
   * Useful for the "Apply Defaults" button in the setup wizard.
   */
  applyDefaults(): void {
    this._state.set(structuredClone(DEFAULT_THEME_CONFIGURATION));
  }

  // ── Update methods ─────────────────────────────────────────────────────────

  updateShape(patch: Partial<ShapeConfig>): void {
    this._state.update(s => ({ ...s, shape: { ...s.shape, ...patch } }));
  }

  updateFont(patch: Partial<FontConfig>): void {
    this._state.update(s => ({ ...s, font: { ...s.font, ...patch } }));
  }

  updateButton(patch: Partial<ButtonConfig>): void {
    this._state.update(s => ({ ...s, button: { ...s.button, ...patch } }));
  }

  updateDialog(patch: Partial<DialogConfig>): void {
    this._state.update(s => ({ ...s, dialog: { ...s.dialog, ...patch } }));
  }

  updateTable(patch: Partial<TableConfig>): void {
    this._state.update(s => ({ ...s, table: { ...s.table, ...patch } }));
  }

  updateTopbar(patch: Partial<TopbarConfig>): void {
    this._state.update(s => ({ ...s, topbar: { ...s.topbar, ...patch } }));
  }

  updateSidebar(patch: Partial<SidebarConfig>): void {
    this._state.update(s => ({ ...s, sidebar: { ...s.sidebar, ...patch } }));
  }

  updateLogin(patch: Partial<LoginConfig>): void {
    this._state.update(s => ({ ...s, login: { ...s.login, ...patch } }));
  }

  /** Replace the entire configuration at once (e.g. when loading a preset) */
  replaceAll(cfg: ThemeConfiguration): void {
    this._state.set(cfg);
  }

  /** Reset a single section back to its default */
  resetSection(section: keyof ThemeConfiguration): void {
    this._state.update(s => ({
      ...s,
      [section]: DEFAULT_THEME_CONFIGURATION[section],
    }));
  }

  /** Reset everything */
  resetAll(): void {
    this._state.set(structuredClone(DEFAULT_THEME_CONFIGURATION));
  }

  // ── CSS variable application ───────────────────────────────────────────────

  private _applyCssVars(cfg: ThemeConfiguration): void {
    const root = document.documentElement;

    // ── Shape ────────────────────────────────────────────────────────────────
    const gs = cfg.shape.globalShape;
    root.style.setProperty('--border-radius',      SHAPE_RADIUS_MAP[gs]);
    root.style.setProperty('--app-shape-radius',   SHAPE_RADIUS_MAP[gs]);
    root.style.setProperty('--p-border-radius-sm', SHAPE_RADIUS_MAP[gs]);
    root.style.setProperty('--app-btn-radius',     BTN_RADIUS_MAP[cfg.button.shape]);
    root.style.setProperty('--app-card-radius',    CARD_RADIUS_MAP[gs]);
    root.style.setProperty('--app-dialog-radius',  DIALOG_RADIUS_MAP[gs]);
    root.style.setProperty('--app-table-radius',   SHAPE_RADIUS_MAP[gs]);

    // ── Card style ───────────────────────────────────────────────────────────
    const cs = cfg.shape.cardStyle;
    root.style.setProperty('--app-card-shadow', CARD_SHADOW_MAP[cs] ?? CARD_SHADOW_MAP['elevated']);
    root.style.setProperty('--app-card-border', CARD_BORDER_MAP[cs] ?? CARD_BORDER_MAP['elevated']);
    root.style.setProperty('--app-card-bg',     CARD_BG_MAP[cs]     ?? CARD_BG_MAP['elevated']);

    // ── Font ─────────────────────────────────────────────────────────────────
    const font = cfg.font;
    this._applyFontEntries(font.entries, root);
    root.style.setProperty('--app-font-size-base',    font.fontSizeBase);
    root.style.setProperty('--app-type-scale-ratio',  font.scaleRatio);
    root.style.setProperty('--app-body-weight',       font.bodyWeight);
    root.style.setProperty('--app-line-height',       font.bodyLineHeight);
    root.style.setProperty('--app-letter-spacing',    font.bodyLetterSpacing);
    root.style.setProperty('--app-body-color',        font.bodyColor);
    root.style.setProperty('--app-body-background',   font.bodyBackground);
    if (font.responsiveMinWidth) root.style.setProperty('--app-responsive-min-width', font.responsiveMinWidth + 'px');
    if (font.responsiveFontSize) root.style.setProperty('--app-responsive-font-size', font.responsiveFontSize + 'px');
    if (font.responsiveScale)    root.style.setProperty('--app-responsive-scale',     font.responsiveScale);

    // ── Button ───────────────────────────────────────────────────────────────
    const btn = cfg.button;
    root.style.setProperty('--app-btn-box-shadow', BTN_SHADOW_MAP[btn.shadow]);
    root.style.setProperty('--app-btn-padding',    BTN_SIZE_MAP[btn.size]);

    // ── Dialog ───────────────────────────────────────────────────────────────
    const dlg = cfg.dialog;
    root.style.setProperty('--app-dialog-header-height',   DIALOG_HEADER_H_MAP[dlg.headerHeight]);
    root.style.setProperty('--app-dialog-overlay-opacity', DIALOG_OVERLAY_MAP[dlg.overlayOpacity]);
    root.style.setProperty('--app-dialog-animation',       dlg.animation);
    root.style.setProperty('--app-dialog-header-bg',
      DIALOG_HEADER_BG_MAP[dlg.style]    ?? 'var(--surface-card)');
    root.style.setProperty('--app-dialog-header-color',
      DIALOG_HEADER_COLOR_MAP[dlg.style] ?? 'var(--text-color)');

    // ── Table ────────────────────────────────────────────────────────────────
    const tbl = cfg.table;
    root.style.setProperty('--app-table-row-separator',   TABLE_ROW_SEP_MAP[tbl.rowSeparator]);
    root.style.setProperty('--app-table-col-separator',   tbl.columnSeparator ? '1px solid var(--surface-border)' : 'none');
    root.style.setProperty('--app-table-header-style-bg', TABLE_HEADER_BG_MAP[tbl.headerStyle]);
    root.style.setProperty('--app-table-striped',         tbl.style === 'striped' ? '1' : '0');
    root.style.setProperty('--app-table-bordered',        tbl.style === 'bordered' ? '1' : '0');
    if (tbl.hoverColor) root.style.setProperty('--app-table-hover-bg', tbl.hoverColor);

    // ── Topbar ───────────────────────────────────────────────────────────────
    const tb = cfg.topbar;
    root.style.setProperty('--app-topbar-height', TOPBAR_H_MAP[tb.height]);
    this._applyTopbarBorder(tb.borderStyle, root);
    const topbarBg = tb.bgColor
      ? tb.bgColor
      : tb.accented
        ? 'var(--primary-color)'
        : 'var(--surface-card)';
    root.style.setProperty('--app-topbar-bg', topbarBg);
    root.style.setProperty('--app-topbar-color',
      (tb.accented && !tb.bgColor) ? '#ffffff' : 'var(--text-color)');

    // ── Sidebar ──────────────────────────────────────────────────────────────
    const sb = cfg.sidebar;
    root.style.setProperty('--app-sidebar-width',      SIDEBAR_W_MAP[sb.width]);
    root.style.setProperty('--app-sidebar-icons-only', sb.iconsOnly ? '1' : '0');
    const sidebarBg = sb.bgColor
      ? sb.bgColor
      : sb.dark
        ? 'var(--surface-900, #18181b)'
        : 'var(--surface-card)';
    root.style.setProperty('--app-sidebar-bg', sidebarBg);

    // ── Login ────────────────────────────────────────────────────────────────
    root.style.setProperty('--app-login-layout', cfg.login.layout);
  }

  private _applyFontEntries(entries: FontEntry[], root: HTMLElement): void {
    entries.forEach((entry, i) => {
      const cssVar = LANG_CSS_VAR[entry.lang] ?? `--app-font-custom-${i}`;
      root.style.setProperty(cssVar, entry.font);
      if (i === 0) {
        root.style.setProperty('--app-font-family', entry.font);
        document.body.style.fontFamily = entry.font;
      }
    });
  }

  private _applyTopbarBorder(borderStyle: TopbarBorder, root: HTMLElement): void {
    if (borderStyle === 'shadow') {
      root.style.setProperty('--app-topbar-border', 'none');
      root.style.setProperty('--app-topbar-shadow', '0 2px 8px rgba(0,0,0,0.08)');
    } else if (borderStyle === 'thin') {
      root.style.setProperty('--app-topbar-border', '1px solid var(--surface-border)');
      root.style.setProperty('--app-topbar-shadow', 'none');
    } else {
      root.style.setProperty('--app-topbar-border', 'none');
      root.style.setProperty('--app-topbar-shadow', 'none');
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _persist(cfg: ThemeConfiguration): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      // quota exceeded — silently ignore
    }
  }

  private _load(): ThemeConfiguration {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return structuredClone(DEFAULT_THEME_CONFIGURATION);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_THEME_CONFIGURATION);
      const parsed = JSON.parse(raw) as Partial<ThemeConfiguration>;
      // Deep merge with defaults so new fields added in future versions
      // are always present even when loading an older stored config.
      return {
        shape:   { ...DEFAULT_THEME_CONFIGURATION.shape,   ...parsed.shape   },
        font:    { ...DEFAULT_THEME_CONFIGURATION.font,    ...parsed.font,
                   entries: parsed.font?.entries ?? [...DEFAULT_THEME_CONFIGURATION.font.entries] },
        button:  { ...DEFAULT_THEME_CONFIGURATION.button,  ...parsed.button  },
        dialog:  { ...DEFAULT_THEME_CONFIGURATION.dialog,  ...parsed.dialog  },
        table:   { ...DEFAULT_THEME_CONFIGURATION.table,   ...parsed.table   },
        topbar:  { ...DEFAULT_THEME_CONFIGURATION.topbar,  ...parsed.topbar,
                   navItems: parsed.topbar?.navItems ?? [] },
        sidebar: { ...DEFAULT_THEME_CONFIGURATION.sidebar, ...parsed.sidebar },
        login:   { ...DEFAULT_THEME_CONFIGURATION.login,   ...parsed.login   },
      };
    } catch {
      return structuredClone(DEFAULT_THEME_CONFIGURATION);
    }
  }
}
