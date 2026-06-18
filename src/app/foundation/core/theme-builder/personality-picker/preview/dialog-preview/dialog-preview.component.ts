import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import {
  BTN_RADIUS_MAP,
  DIALOG_RADIUS_MAP,
  type DialogStyle,
  type DialogHeaderHeight,
  type ComponentShape,
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

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dialog-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule],
  templateUrl: './dialog-preview.component.html',
  styleUrls:   ['./dialog-preview.component.scss'],
})
export class DialogPreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  /** الـ dialog مفتوح دايماً في الـ preview */
  readonly visible = true;

  readonly dialogStyle = computed(() => {
    const dlg   = this.store.dialog();
    const shape = this.store.shape().globalShape;
    const btn   = this.store.button();
    const style = dlg.style;
    const isPopup = style === 'popup';
    const borderStyle = isPopup ? 'none' : DIALOG_BORDER_MAP[style];

    const base: Record<string, string> = {
      borderRadius: DIALOG_RADIUS_MAP[shape],
      border:       borderStyle,
      width:        '380px',
      minWidth:     '280px',
      maxWidth:     '95%',
      '--app-dialog-radius':        DIALOG_RADIUS_MAP[shape],
      '--app-dialog-border':        borderStyle,
      '--app-dialog-header-bg':     DIALOG_HEADER_BG[style],
      '--app-dialog-header-color':  DIALOG_HEADER_COLOR[style],
      '--app-dialog-header-height': DIALOG_HEADER_HEIGHT_MAP[dlg.headerHeight],
      '--app-btn-radius':           BTN_RADIUS_MAP[btn.shape],
    };

    if (isPopup) {
      base['boxShadow']        = '0 0 0 2px transparent, 0 14px 40px rgba(0,0,0,0.15)';
      base['backgroundImage']  = 'none';
      base['--app-dialog-is-popup'] = '1';
    }

    return base;
  });

  readonly headerStyle = computed<Record<string, string>>(() => ({
    minHeight:  DIALOG_HEADER_HEIGHT_MAP[this.store.dialog().headerHeight],
    display:    'flex',
    alignItems: 'center',
    width:      '100%',
  }));

  readonly inputRadius = computed<string>(() =>
    SHAPE_RADIUS_MAP[this.store.shape().globalShape]
  );

  readonly btnRadius = computed<string>(() =>
    BTN_RADIUS_MAP[this.store.button().shape]
  );

  readonly btnShadow = computed<string>(() =>
    BTN_SHADOW_MAP[this.store.button().shadow] ?? 'none'
  );
}
