import { Component, computed, inject, signal, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import {
  BTN_RADIUS_MAP,
  DIALOG_RADIUS_MAP,
  type DialogStyle,
  type DialogHeaderHeight,
  type DialogOverlay,
  type DialogAnimation,
  type ComponentShape,
  type SidebarWidth,
  type TopbarHeight,
  type TopbarBorder,
} from '../../../theme-configuration.model';

// ── Maps ──────────────────────────────────────────────────────────────────────

const DIALOG_HEADER_BG: Record<DialogStyle, string> = {
  'flat':            'var(--surface-card)',
  'accent-header':   'var(--primary-color)',
  'gradient-header': 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 60%, #8b5cf6))',
  'outlined':        'var(--surface-card)',
  'popup':           'var(--surface-card)',
};

const DIALOG_HEADER_COLOR: Record<DialogStyle, string> = {
  'flat':            'var(--text-color)',
  'accent-header':   '#fff',
  'gradient-header': '#fff',
  'outlined':        'var(--text-color)',
  'popup':           'var(--text-color)',
};

const DIALOG_BORDER_MAP: Record<DialogStyle, string> = {
  'flat':            'none',
  'accent-header':   'none',
  'gradient-header': 'none',
  'outlined':        '2px solid var(--primary-color)',
  'popup':           '2px solid transparent',
};

const DIALOG_HEADER_HEIGHT_MAP: Record<DialogHeaderHeight, string> = {
  compact: '36px',
  normal:  '52px',
  tall:    '68px',
};

const BTN_SHADOW_MAP: Record<string, string> = {
  none:   'none',
  soft:   '0 2px 8px rgba(0,0,0,0.12)',
  lifted: '0 4px 16px rgba(0,0,0,0.2)',
};

const SHAPE_RADIUS_MAP: Record<ComponentShape, string> = {
  sharp:   '3px',
  rounded: '8px',
  soft:    '16px',
  pill:    '24px',
};

/** نفس قيم DIALOG_OVERLAY_MAP في store — محلية عشان نعكسها كـ opacity على الـ backdrop div */
const DIALOG_OVERLAY_OPACITY_MAP: Record<DialogOverlay, string> = {
  light:  '0.3',
  medium: '0.5',
  dark:   '0.75',
};

const SHELL_SIDEBAR_WIDTH_MAP: Record<SidebarWidth, string> = {
  narrow: '36px',
  normal: '44px',
  wide:   '52px',
};

const SHELL_TOPBAR_HEIGHT_MAP: Record<TopbarHeight, string> = {
  compact: '36px',
  normal:  '48px',
  tall:    '60px',
};

const SHELL_TOPBAR_BORDER_MAP: Record<TopbarBorder, string> = {
  none:   'none',
  thin:   '1px solid rgba(0,0,0,0.1)',
  shadow: '0 2px 6px rgba(0,0,0,0.08)',
};

/** كل animation عنده transform بداية مختلف + توقيت — بيتبعتوا كـ params للـ Angular trigger */
const DIALOG_ANIM_PARAMS: Record<DialogAnimation, { fromTransform: string; duration: string; easing: string }> = {
  fade:  { fromTransform: 'none',              duration: '220ms', easing: 'ease-out' },
  slide: { fromTransform: 'translateY(20px)',   duration: '260ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  zoom:  { fromTransform: 'scale(0.82)',        duration: '200ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dialog-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dialog-preview.component.html',
  styleUrls:   ['./dialog-preview.component.scss'],
  animations: [
    trigger('dialogPop', [
      transition(':enter', [
        style({ opacity: 0, transform: '{{fromTransform}}' }),
        animate('{{duration}} {{easing}}', style({ opacity: 1, transform: 'none' })),
      ], { params: { fromTransform: 'none', duration: '220ms', easing: 'ease-out' } }),
      transition(':leave', [
        animate('{{duration}} {{easing}}', style({ opacity: 0, transform: '{{fromTransform}}' })),
      ], { params: { fromTransform: 'none', duration: '220ms', easing: 'ease-out' } }),
    ]),
    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('180ms ease-out'),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class DialogPreviewComponent implements OnChanges {
  private readonly store = inject(ThemeConfigurationStore);

  /** لما بيكون true → الديالوج يظهر دايمًا ومش بيتقفل بالزر */
  @Input() forceOpen = false;

  /** toggle لفتح/قفل الدايلوج — عشان animation و overlay opacity يبانوا فعليًا */
  private readonly _open = signal(true);
  readonly open = this._open.asReadonly();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forceOpen'] && this.forceOpen) {
      this._open.set(true);
    }
  }

  toggleOpen(): void {
    if (this.forceOpen) {
      // replay animation بس مش بيقفل
      this._open.set(false);
      setTimeout(() => this._open.set(true), 10);
    } else {
      this._open.update((v) => !v);
    }
  }

  // ── Dialog styles ─────────────────────────────────────────────────────────

  readonly dialogBoxStyle = computed(() => {
    const dlg     = this.store.dialog();
    const shape   = this.store.shape().globalShape;
    const btn     = this.store.button();
    const st      = dlg.style;
    const isPopup = st === 'popup';
    const border  = isPopup ? 'none' : DIALOG_BORDER_MAP[st];

    const base: Record<string, string> = {
      borderRadius:               DIALOG_RADIUS_MAP[shape],
      border,
      '--app-dialog-radius':       DIALOG_RADIUS_MAP[shape],
      '--app-dialog-border':       border,
      '--app-dialog-header-bg':    DIALOG_HEADER_BG[st],
      '--app-dialog-header-color': DIALOG_HEADER_COLOR[st],
      '--app-dialog-header-height': DIALOG_HEADER_HEIGHT_MAP[dlg.headerHeight],
      '--app-btn-radius':           BTN_RADIUS_MAP[btn.shape],
    };

    if (isPopup) {
      base['boxShadow'] = '0 0 0 2px transparent, 0 14px 40px rgba(0,0,0,0.18)';
    }

    return base;
  });

  readonly headerStyle = computed<Record<string, string>>(() => ({
    minHeight:  DIALOG_HEADER_HEIGHT_MAP[this.store.dialog().headerHeight],
    background: DIALOG_HEADER_BG[this.store.dialog().style],
    color:      DIALOG_HEADER_COLOR[this.store.dialog().style],
    display:    'flex',
    alignItems: 'center',
    padding:    '0 1rem',
  }));

  readonly inputRadius  = computed<string>(() => SHAPE_RADIUS_MAP[this.store.shape().globalShape]);
  readonly btnRadius    = computed<string>(() => BTN_RADIUS_MAP[this.store.button().shape]);
  readonly btnShadow    = computed<string>(() => BTN_SHADOW_MAP[this.store.button().shadow] ?? 'none');

  readonly isPopup = computed(() => this.store.dialog().style === 'popup');

  // ── Mini dashboard shell ──────────────────────────────────────────────────

  readonly shellTopbarStyle = computed(() => {
    const tb = this.store.topbar();
    return {
      height:       SHELL_TOPBAR_HEIGHT_MAP[tb.height],
      borderBottom: tb.borderStyle !== 'shadow' ? SHELL_TOPBAR_BORDER_MAP[tb.borderStyle] : 'none',
      boxShadow:    tb.borderStyle === 'shadow'  ? SHELL_TOPBAR_BORDER_MAP['shadow'] : 'none',
      background:   tb.bgColor || (tb.accented ? 'var(--primary-color)' : 'var(--surface-card)'),
    };
  });

  readonly shellSidebarStyle = computed(() => {
    const sb = this.store.sidebar();
    return {
      width:      sb.iconsOnly ? '28px' : SHELL_SIDEBAR_WIDTH_MAP[sb.width],
      background: sb.bgColor || (sb.dark ? 'var(--surface-900, #18181b)' : 'var(--surface-card)'),
    };
  });

  // ── Overlay backdrop ──────────────────────────────────────────────────────

  readonly overlayOpacity = computed<string>(
    () => DIALOG_OVERLAY_OPACITY_MAP[this.store.dialog().overlayOpacity]
  );

  // ── Animation params ──────────────────────────────────────────────────────

  readonly animParams = computed(() => DIALOG_ANIM_PARAMS[this.store.dialog().animation]);
}