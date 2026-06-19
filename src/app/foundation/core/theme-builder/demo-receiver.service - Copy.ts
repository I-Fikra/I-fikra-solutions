/**
 * demo-receiver.service.ts
 *
 * يُضاف في الـ Demo Site فقط (platform-demo).
 * يستمع على BroadcastChannel 'theme_preview_channel' وبيطبق الـ ThemeConfiguration
 * على document.documentElement فورًا بدون reload.
 *
 * Step 7 of the Theme-Builder Refactor.
 *
 * ─── كيف تُضيفه في الـ Demo app ────────────────────────────────────────────
 * في app.config.ts الخاص بالـ demo:
 *
 *   import { DemoReceiverService } from '@/app/foundation/core/theme-builder/demo-receiver.service';
 *
 *   export const appConfig: ApplicationConfig = {
 *     providers: [
 *       ...
 *       { provide: APP_INITIALIZER,
 *         useFactory: (svc: DemoReceiverService) => () => svc.init(),
 *         deps: [DemoReceiverService],
 *         multi: true },
 *     ]
 *   };
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  type ThemeConfiguration,
  type FontEntry,
  type TableRowSeparator,
  type TableHeaderStyle,
  type ButtonShadow,
  type ButtonSize,
  type DialogHeaderHeight,
  type DialogOverlay,
  type DialogStyle,
  type TopbarHeight,
  type TopbarBorder,
  type SidebarWidth,
  SHAPE_RADIUS_MAP,
  BTN_RADIUS_MAP,
  CARD_RADIUS_MAP,
  DIALOG_RADIUS_MAP,
  DEFAULT_THEME_CONFIGURATION,
} from './theme-configuration.model';

const BROADCAST_CHANNEL_NAME  = 'theme_preview_channel';
const DEMO_THEME_CONFIG_KEY   = 'theme_preview_config';

// ── CSS variable maps (mirrors theme-configuration.store.ts) ─────────────────

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

@Injectable({ providedIn: 'root' })
export class DemoReceiverService {
  private readonly platformId = inject(PLATFORM_ID);
  private channel: BroadcastChannel | null = null;

  /**
   * يبدأ الـ BroadcastChannel listener ويحمّل الـ config المحفوظ في localStorage.
   * استدعيه في APP_INITIALIZER أو في ngOnInit للـ AppComponent.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // ── 1. حمّل الـ config المحفوظ (initial load) ─────────────────────────
    try {
      const raw = localStorage.getItem(DEMO_THEME_CONFIG_KEY);
      if (raw) {
        const cfg = JSON.parse(raw) as Partial<ThemeConfiguration>;
        this._applyCssVars(this._mergeWithDefaults(cfg));
      }
    } catch {
      // malformed JSON — silently ignore
    }

    // ── 2. افتح الـ BroadcastChannel وابدأ التسمع ─────────────────────────
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent) => {
        const msg = event.data as { type: string; payload: Partial<ThemeConfiguration> };
        if (msg?.type === 'theme_update' && msg.payload) {
          this._applyCssVars(this._mergeWithDefaults(msg.payload));
        }
      };
    }
  }

  /** إغلاق الـ channel عند destroy */
  destroy(): void {
    this.channel?.close();
    this.channel = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _mergeWithDefaults(partial: Partial<ThemeConfiguration>): ThemeConfiguration {
    return {
      shape:   { ...DEFAULT_THEME_CONFIGURATION.shape,   ...partial.shape   },
      font:    { ...DEFAULT_THEME_CONFIGURATION.font,    ...partial.font,
                 entries: partial.font?.entries ?? [...DEFAULT_THEME_CONFIGURATION.font.entries] },
      button:  { ...DEFAULT_THEME_CONFIGURATION.button,  ...partial.button  },
      dialog:  { ...DEFAULT_THEME_CONFIGURATION.dialog,  ...partial.dialog  },
      table:   { ...DEFAULT_THEME_CONFIGURATION.table,   ...partial.table   },
      topbar:  { ...DEFAULT_THEME_CONFIGURATION.topbar,  ...partial.topbar,
                 navItems: partial.topbar?.navItems ?? [] },
      sidebar: { ...DEFAULT_THEME_CONFIGURATION.sidebar, ...partial.sidebar },
      login:   { ...DEFAULT_THEME_CONFIGURATION.login,   ...partial.login   },
    };
  }

  private _applyCssVars(cfg: ThemeConfiguration): void {
    const root = document.documentElement;

    // ── Shape ────────────────────────────────────────────────────────────────
    const gs = cfg.shape.globalShape;
    root.style.setProperty('--app-shape-radius',  SHAPE_RADIUS_MAP[gs]);
    root.style.setProperty('--app-btn-radius',    BTN_RADIUS_MAP[cfg.button.shape]);
    root.style.setProperty('--app-card-radius',   CARD_RADIUS_MAP[gs]);
    root.style.setProperty('--app-dialog-radius', DIALOG_RADIUS_MAP[gs]);
    root.style.setProperty('--app-table-radius',  SHAPE_RADIUS_MAP[gs]);
    root.style.setProperty('--p-border-radius-sm', SHAPE_RADIUS_MAP[gs]);

    // ── Font ─────────────────────────────────────────────────────────────────
    const font = cfg.font;
    this._applyFontEntries(font.entries, root);
    root.style.setProperty('--app-font-size-base',      font.fontSizeBase);
    root.style.setProperty('--app-type-scale-ratio',    font.scaleRatio);
    root.style.setProperty('--app-body-weight',         font.bodyWeight);
    root.style.setProperty('--app-line-height',         font.bodyLineHeight);
    root.style.setProperty('--app-letter-spacing',      font.bodyLetterSpacing);
    root.style.setProperty('--app-body-color',          font.bodyColor);
    root.style.setProperty('--app-body-background',     font.bodyBackground);
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
    this._applyDialogStyle(dlg.style, root);

    // ── Table ────────────────────────────────────────────────────────────────
    const tbl = cfg.table;
    root.style.setProperty('--app-table-row-separator',   TABLE_ROW_SEP_MAP[tbl.rowSeparator]);
    root.style.setProperty('--app-table-col-separator',   tbl.columnSeparator ? '1px solid var(--surface-border)' : 'none');
    root.style.setProperty('--app-table-header-style-bg', TABLE_HEADER_BG_MAP[tbl.headerStyle]);
    root.style.setProperty('--app-table-striped',         tbl.style === 'striped' ? '1' : '0');
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

  private _applyDialogStyle(style: DialogStyle, root: HTMLElement): void {
    const styleMap: Record<DialogStyle, Record<string, string>> = {
      'flat':            { '--app-dialog-header-bg': 'var(--surface-card)',   '--app-dialog-header-color': 'var(--text-color)',       '--app-dialog-shadow': 'none',                                      '--app-dialog-border': '1px solid var(--surface-border)' },
      'accent-header':   { '--app-dialog-header-bg': 'var(--primary-color)',  '--app-dialog-header-color': '#fff',                    '--app-dialog-shadow': '0 8px 32px rgba(0,0,0,0.12)',               '--app-dialog-border': 'none' },
      'gradient-header': { '--app-dialog-header-bg': 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 60%, #8b5cf6))', '--app-dialog-header-color': '#fff', '--app-dialog-shadow': '0 8px 32px rgba(0,0,0,0.12)', '--app-dialog-border': 'none' },
      'outlined':        { '--app-dialog-header-bg': 'transparent',           '--app-dialog-header-color': 'var(--text-color)',       '--app-dialog-shadow': 'none',                                      '--app-dialog-border': '2px solid var(--primary-color)' },
      'popup':           { '--app-dialog-header-bg': 'var(--surface-ground)', '--app-dialog-header-color': 'var(--text-color)',       '--app-dialog-shadow': '0 20px 60px rgba(0,0,0,0.2)',              '--app-dialog-border': 'none' },
    };
    const vars = styleMap[style] ?? styleMap['flat'];
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
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
}
