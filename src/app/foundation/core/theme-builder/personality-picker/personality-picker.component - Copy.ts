import {
  Component, inject, signal, computed, effect, ChangeDetectionStrategy,
  Input, Output, EventEmitter, OnChanges, SimpleChanges,
  ViewChild, ElementRef, AfterViewInit, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ButtonModule }       from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule }       from 'primeng/select';
import { DividerModule }      from 'primeng/divider';
import { TooltipModule }      from 'primeng/tooltip';
import { InputTextModule }    from 'primeng/inputtext';
import { DialogModule }       from 'primeng/dialog';


import { ThemeConfigurationStore } from '../theme-configuration.store';

import {
  ThemePersonalityService,
  PERSONALITIES,
  CustomPersonality,
  TypographyTokens,
  FontEntry,
  DEFAULT_FONT_ENTRIES,
  ComponentDetails,
  ColorZones,
  tokensFromCustom,
  applyComponentDetails,
  applyColorZones,
  ComponentShape,
  TableStyle,
  DialogStyle,
  CardStyle,
  TableRowSeparator,
  TableHeaderStyle,
  ButtonSize,
  ButtonShadow,
  ButtonIconPos,
  DialogHeaderHeight,
  DialogOverlay,
  DialogAnimation,
  TopbarHeight,
  TopbarBorder,
  TopbarNavAlign,
  TopbarNavStyle,
  TopbarLogoStyle,
  TopbarNavItem,
  SidebarWidth,
  LoginLayout,
  LoginBg,
  LoginLogoPos,
} from '../theme-personality.service';

import { $t } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { LayoutService }   from '@/app/foundation/core/layout/service/layout.service';
import { SettingsService } from '@/app/foundation/core/settings/settings.service';
import { ButtonPreviewComponent } from './preview/button-preview/button-preview.component';
import { DialogPreviewComponent } from './preview/dialog-preview/dialog-preview.component';
import { TablePreviewComponent }   from './preview/table-preview/table-preview.component';
import { TopbarPreviewComponent }  from './preview/topbar-preview/topbar-preview.component';
import { SidebarPreviewComponent } from './preview/sidebar-preview/sidebar-preview.component';
import { LoginPreviewComponent }   from './preview/login-preview/login-preview.component';

const PRESETS = { Aura, Lara, Nora } as const;

const ACCENT_MAP: Record<string, string> = {
  'clean-pro':     '#38bdf8',
  'bold-maritime': '#06b6d4',
  'soft-modern':   '#8b5cf6',
  'dark-elite':    '#f59e0b',
  'glass-popup':   '#3b82f6',
  'card-focus':    '#6366f1',
  'table-master':  '#14b8a6',
  'popup-accent':  '#10b981',
  'dark-popup':    '#22d3ee',
};

const SHAPE_OPTIONS:  { label: string; value: ComponentShape }[] = [
  { label: 'Sharp',   value: 'sharp'   },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Soft',    value: 'soft'    },
  { label: 'Pill',    value: 'pill'    },
];
const TABLE_OPTIONS:  { label: string; value: TableStyle }[] = [
  { label: 'Default',  value: 'default'  },
  { label: 'Striped',  value: 'striped'  },
  { label: 'Bordered', value: 'bordered' },
  { label: 'Minimal',  value: 'minimal'  },
];
const DIALOG_OPTIONS: { label: string; value: DialogStyle }[] = [
  { label: 'Flat',     value: 'flat'            },
  { label: 'Accent',   value: 'accent-header'   },
  { label: 'Gradient', value: 'gradient-header' },
  { label: 'Outlined', value: 'outlined'        },
  { label: 'Popup',    value: 'popup'           },
];
const CARD_OPTIONS: { label: string; value: CardStyle }[] = [
  { label: 'Elevated', value: 'elevated' },
  { label: 'Bordered', value: 'bordered' },
  { label: 'Flat',     value: 'flat'     },
  { label: 'Glass',    value: 'glass'    },
];
const FONT_OPTIONS = [
  { label: 'Lato (default)',    value: "'Lato', sans-serif"          },
  { label: 'Nunito (friendly)', value: "'Nunito', sans-serif"        },
  { label: 'Source Sans 3',     value: "'Source Sans 3', sans-serif" },
  { label: 'DM Sans (modern)',  value: "'DM Sans', sans-serif"       },
  { label: 'Inter',             value: "'Inter', sans-serif"         },
];
const ARABIC_FONT_OPTIONS = [
  { label: 'Cairo (default)',   value: "'Cairo', sans-serif"         },
  { label: 'Tajawal',          value: "'Tajawal', sans-serif"       },
  { label: 'Noto Sans Arabic', value: "'Noto Sans Arabic', sans-serif" },
  { label: 'IBM Plex Arabic',  value: "'IBM Plex Sans Arabic', sans-serif" },
  { label: 'Almarai',          value: "'Almarai', sans-serif"       },
];
const TABLE_ROW_SEP_OPTIONS: { label: string; value: TableRowSeparator }[] = [
  { label: 'None',    value: 'none'    },
  { label: 'Thin',    value: 'thin'    },
  { label: 'Thick',   value: 'thick'   },
  { label: 'Colored', value: 'colored' },
];
const TABLE_HEADER_STYLE_OPTIONS: { label: string; value: TableHeaderStyle }[] = [
  { label: 'Filled',   value: 'filled'   },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Minimal',  value: 'minimal'  },
];
const BTN_SIZE_OPTIONS: { label: string; value: ButtonSize }[] = [
  { label: 'SM', value: 'sm' },
  { label: 'MD', value: 'md' },
  { label: 'LG', value: 'lg' },
];
const BTN_SHADOW_OPTIONS: { label: string; value: ButtonShadow }[] = [
  { label: 'None',   value: 'none'   },
  { label: 'Soft',   value: 'soft'   },
  { label: 'Lifted', value: 'lifted' },
];
const BTN_ICON_POS_OPTIONS: { label: string; value: ButtonIconPos }[] = [
  { label: 'Left',  value: 'left'  },
  { label: 'Right', value: 'right' },
];
const DIALOG_HEADER_H_OPTIONS: { label: string; value: DialogHeaderHeight }[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Normal',  value: 'normal'  },
  { label: 'Tall',    value: 'tall'    },
];
const DIALOG_OVERLAY_OPTIONS: { label: string; value: DialogOverlay }[] = [
  { label: 'Light',  value: 'light'  },
  { label: 'Medium', value: 'medium' },
  { label: 'Dark',   value: 'dark'   },
];
const DIALOG_ANIM_OPTIONS: { label: string; value: DialogAnimation }[] = [
  { label: 'Fade',  value: 'fade'  },
  { label: 'Slide', value: 'slide' },
  { label: 'Zoom',  value: 'zoom'  },
];
const TOPBAR_HEIGHT_OPTIONS: { label: string; value: TopbarHeight }[] = [
  { label: 'Compact (48px)', value: 'compact' },
  { label: 'Normal (64px)',  value: 'normal'  },
  { label: 'Tall (80px)',    value: 'tall'    },
];
const TOPBAR_BORDER_OPTIONS: { label: string; value: TopbarBorder }[] = [
  { label: 'None',   value: 'none'   },
  { label: 'Line',   value: 'thin'   },
  { label: 'Shadow', value: 'shadow' },
];
const TOPBAR_LOGO_OPTIONS: { label: string; value: TopbarLogoStyle }[] = [
  { label: 'Icon + Text', value: 'icon-text'  },
  { label: 'Icon Only',   value: 'icon-only'  },
  { label: 'Text Only',   value: 'text-only'  },
  { label: 'Hidden',      value: 'hidden'     },
];
const TOPBAR_NAV_ALIGN_OPTIONS: { label: string; value: TopbarNavAlign }[] = [
  { label: 'Left',   value: 'left'   },
  { label: 'Center', value: 'center' },
  { label: 'Right',  value: 'right'  },
];
const TOPBAR_NAV_STYLE_OPTIONS: { label: string; value: TopbarNavStyle }[] = [
  { label: 'Links',     value: 'links'     },
  { label: 'Pills',     value: 'pills'     },
  { label: 'Underline', value: 'underline' },
  { label: 'Buttons',   value: 'buttons'   },
];
const SIDEBAR_WIDTH_OPTIONS: { label: string; value: SidebarWidth }[] = [
  { label: 'Narrow (200px)', value: 'narrow' },
  { label: 'Normal (240px)', value: 'normal' },
  { label: 'Wide (280px)',   value: 'wide'   },
];
const LOGIN_LAYOUT_OPTIONS: { label: string; value: LoginLayout }[] = [
  { label: 'Centered Card', value: 'centered'   },
  { label: 'Split Screen',  value: 'split'      },
  { label: 'Full Screen',   value: 'fullscreen' },
];
const LOGIN_BG_OPTIONS: { label: string; value: LoginBg }[] = [
  { label: 'Solid Color', value: 'solid'    },
  { label: 'Gradient',    value: 'gradient' },
  { label: 'Image',       value: 'image'    },
];
const LOGIN_LOGO_POS_OPTIONS: { label: string; value: LoginLogoPos }[] = [
  { label: 'Top',    value: 'top'    },
  { label: 'Left',   value: 'left'   },
  { label: 'Hidden', value: 'hidden' },
];

const SHAPE_RADIUS:  Record<ComponentShape, string> = { sharp: '3px',  rounded: '8px',  soft: '16px', pill: '24px'  };
const BTN_RADIUS:    Record<ComponentShape, string> = { sharp: '3px',  rounded: '6px',  soft: '12px', pill: '999px' };
const CARD_RADIUS:   Record<ComponentShape, string> = { sharp: '4px',  rounded: '10px', soft: '18px', pill: '24px'  };
const DIALOG_RADIUS: Record<ComponentShape, string> = { sharp: '4px',  rounded: '12px', soft: '20px', pill: '28px'  };

const DIALOG_HEADER_BG: Record<DialogStyle, string> = {
  'flat':            'var(--surface-card)',
  'accent-header':   'var(--primary-color)',
  'gradient-header': 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 60%, #8b5cf6))',
  'outlined':        'var(--surface-card)',
  'popup':           'var(--surface-card)',
};
const DIALOG_HEADER_COLOR: Record<DialogStyle, string> = {
  'flat': 'var(--text-color)', 'accent-header': '#fff',
  'gradient-header': '#fff',   'outlined': 'var(--text-color)',
  'popup': 'var(--text-color)',
};
const DIALOG_BORDER_MAP: Record<DialogStyle, string> = {
  'flat': 'none', 'accent-header': 'none',
  'gradient-header': 'none', 'outlined': '2px solid var(--primary-color)',
  'popup': '2px solid transparent',
};
const CARD_SHADOW: Record<CardStyle, string> = {
  elevated: '0 4px 20px rgba(0,0,0,0.09)', bordered: 'none', flat: 'none',
  glass: '0 8px 32px rgba(0,0,0,0.12)',
};
const CARD_BORDER: Record<CardStyle, string> = {
  elevated: '1px solid transparent', bordered: '1.5px solid var(--surface-border)',
  flat: '1px solid var(--surface-border)', glass: '1px solid rgba(255,255,255,0.22)',
};
const CARD_BG: Record<CardStyle, string> = {
  elevated: 'var(--surface-card)', bordered: 'var(--surface-card)',
  flat: 'var(--surface-ground)', glass: 'rgba(255,255,255,0.12)',
};
const DIALOG_HEADER_HEIGHT_MAP: Record<DialogHeaderHeight, string> = {
  compact: '36px', normal: '52px', tall: '68px',
};
const TABLE_HEADER_STYLE_BG: Record<TableHeaderStyle, string> = {
  filled:   'var(--surface-ground)',
  gradient: 'linear-gradient(90deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #8b5cf6))',
  minimal:  'transparent',
};

export const GLOBAL_SHAPE_PREVIEW_ITEMS = [
  { label: 'Sharp',   value: 'sharp'   as ComponentShape, radius: '2px'   },
  { label: 'Soft',    value: 'soft'    as ComponentShape, radius: '10px'  },
  { label: 'Rounded', value: 'rounded' as ComponentShape, radius: '16px'  },
  { label: 'Pill',    value: 'pill'    as ComponentShape, radius: '999px' },
];

@Component({
  selector: 'app-personality-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SelectButtonModule, ToggleSwitchModule,
    SelectModule, DividerModule, TooltipModule, InputTextModule,
    DialogModule,
    ButtonPreviewComponent,
    DialogPreviewComponent,
    TablePreviewComponent,
    TopbarPreviewComponent,
    SidebarPreviewComponent,
    LoginPreviewComponent,
  ],
  templateUrl: './personality-picker.component.html',
  styleUrls:   ['./personality-picker.component.scss'],
})
export class PersonalityPickerComponent {
  private readonly svc             = inject(ThemePersonalityService);
  readonly themeStore              = inject(ThemeConfigurationStore);
  private readonly layoutService   = inject(LayoutService);
  private readonly settingsService = inject(SettingsService);
  private readonly config          = inject(PrimeNG);
  private readonly sanitizer       = inject(DomSanitizer);
  private readonly platformId      = inject(PLATFORM_ID);

  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  readonly previewPageUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl('/preview/theme-demo');

  readonly personalities = PERSONALITIES;
  readonly activeKey     = this.svc.activeKey;

  readonly builderSections = [
    { key: 'shape',   icon: 'pi pi-stop',            label: 'Shape'   },
    { key: 'font',    icon: 'pi pi-font',            label: 'Font'    },
    { key: 'table',   icon: 'pi pi-table',           label: 'Table'   },
    { key: 'button',  icon: 'pi pi-send',            label: 'Button'  },
    { key: 'dialog',  icon: 'pi pi-window-maximize', label: 'Dialog'  },
    { key: 'topbar',  icon: 'pi pi-bars',            label: 'Topbar'  },
    { key: 'sidebar', icon: 'pi pi-list',            label: 'Sidebar' },
    { key: 'login',   icon: 'pi pi-sign-in',         label: 'Login'   },
  ];

  readonly shapeOptions              = SHAPE_OPTIONS;
  readonly tableOptions              = TABLE_OPTIONS;
  readonly dialogOptions             = DIALOG_OPTIONS;
  readonly cardOptions               = CARD_OPTIONS;
  readonly fontOptions               = FONT_OPTIONS;
  readonly arabicFontOptions         = ARABIC_FONT_OPTIONS;
  readonly tableRowSepOptions        = TABLE_ROW_SEP_OPTIONS;
  readonly tableHeaderStyleOptions   = TABLE_HEADER_STYLE_OPTIONS;
  readonly btnSizeOptions            = BTN_SIZE_OPTIONS;
  readonly btnShadowOptions          = BTN_SHADOW_OPTIONS;
  readonly btnIconPosOptions         = BTN_ICON_POS_OPTIONS;
  readonly dialogHeaderHOptions      = DIALOG_HEADER_H_OPTIONS;
  readonly dialogOverlayOptions      = DIALOG_OVERLAY_OPTIONS;
  readonly dialogAnimOptions         = DIALOG_ANIM_OPTIONS;
  readonly topbarHeightOptions       = TOPBAR_HEIGHT_OPTIONS;
  readonly topbarBorderOptions       = TOPBAR_BORDER_OPTIONS;
  readonly topbarLogoOptions         = TOPBAR_LOGO_OPTIONS;
  readonly topbarNavAlignOptions     = TOPBAR_NAV_ALIGN_OPTIONS;
  readonly topbarNavStyleOptions     = TOPBAR_NAV_STYLE_OPTIONS;
  readonly sidebarWidthOptions       = SIDEBAR_WIDTH_OPTIONS;
  readonly loginLayoutOptions        = LOGIN_LAYOUT_OPTIONS;

  // ── Topbar Nav Items helpers ──────────────────────────────────────────────
  readonly navDraft = signal<Omit<TopbarNavItem, 'id'>>({ label: '', icon: 'pi pi-link', route: '/', enabled: true });

  addNavItem(): void {
    const d = this.navDraft();
    if (!d.label.trim() || !d.route.trim()) return;
    const item: TopbarNavItem = { ...d, id: Date.now().toString(36) };
    this.patchComponentDetails({ topbarNavItems: [...this.custom().componentDetails.topbarNavItems, item] });
    this.navDraft.set({ label: '', icon: 'pi pi-link', route: '/', enabled: true });
  }

  removeNavItem(id: string): void {
    this.patchComponentDetails({
      topbarNavItems: this.custom().componentDetails.topbarNavItems.filter(i => i.id !== id)
    });
  }

  toggleNavItem(id: string, enabled: boolean): void {
    this.patchComponentDetails({
      topbarNavItems: this.custom().componentDetails.topbarNavItems.map(i => i.id === id ? { ...i, enabled } : i)
    });
  }

  moveNavItem(id: string, dir: -1 | 1): void {
    const items = [...this.custom().componentDetails.topbarNavItems];
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    [items[idx], items[swap]] = [items[swap], items[idx]];
    this.patchComponentDetails({ topbarNavItems: items });
  }

  patchNavDraft(patch: Partial<Omit<TopbarNavItem, 'id'>>): void {
    this.navDraft.update(d => ({ ...d, ...patch }));
  }
  readonly loginBgOptions            = LOGIN_BG_OPTIONS;
  readonly loginLogoPosOptions       = LOGIN_LOGO_POS_OPTIONS;
  readonly globalShapePreviewItems   = GLOBAL_SHAPE_PREVIEW_ITEMS;

  readonly fontLangOptions = [
    'English / Latin', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Greek', 'Cyrillic', 'Custom',
  ];

  custom = signal<CustomPersonality>({ ...this.svc.customPersonality() });
  activeBuilderSection = signal<'shape' | 'font' | 'table' | 'button' | 'dialog' | 'topbar' | 'sidebar' | 'login'>('shape');

  @Input() set activeSection(val: string) {
    if (val) {
      this.activeBuilderSection.set(val as any);
    }
  }
  @Output() activeSectionChange = new EventEmitter<string>();

  /** Whether the expanded two-pane layout (settings 1/3 + full preview 2/3) is active */
  @Input() previewExpanded = false;

  /** When true, this instance renders ONLY the full demo page preview (used in the expanded right pane) */
  @Input() fullPageOnly = false;

  constructor() {
    if (this.fullPageOnly) {
      // The full-page preview pane has no controls of its own — keep it in sync
      // with whatever the settings pane (or any other instance) last saved.
      effect(() => {
        const shared = this.svc.customPersonality();
        this.custom.set({ ...shared });
        // Push CSS vars into iframe whenever personality changes
        setTimeout(() => this._syncCssVarsToIframe(), 50);
      });
    } else {
      // Live-apply lightweight token/CSS-variable changes on every edit so the
      // expanded preview (and the rest of the app) reflect changes instantly.
      effect(() => {
        const c = this.custom();
        this.svc.saveCustom(c);
        this.svc.applyPersonality(tokensFromCustom(c));
        applyComponentDetails(c.componentDetails, document.documentElement);
        applyColorZones(c.colorZones, document.documentElement);
      });

      // Re-apply the PrimeNG preset only when the preset/primary/surface/dark
      // combo actually changes — this call is comparatively expensive.
      let lastPresetKey = '';
      effect(() => {
        const c = this.custom();
        const key = `${c.primePreset}|${c.primePrimary}|${c.primeSurface}|${c.primeDark}`;
        if (key === lastPresetKey) return;
        lastPresetKey = key;
        this._applyPrimePreset(c.primePreset, c.primePrimary, c.primeSurface, c.primeDark);
      });
    }
  }

  // ── Font entry helpers ────────────────────────────────────────────────────
  get fontEntries(): FontEntry[] {
    return this.custom().fontEntries?.length
      ? this.custom().fontEntries
      : DEFAULT_FONT_ENTRIES;
  }

  addFontEntry(): void {
    const entries = [...this.fontEntries, { lang: 'Arabic', font: "'Cairo', sans-serif" }];
    this.custom.update(c => ({ ...c, fontEntries: entries }));
  }

  removeFontEntry(index: number): void {
    if (index === 0) return; // can't remove primary
    const entries = this.fontEntries.filter((_, i) => i !== index);
    this.custom.update(c => ({ ...c, fontEntries: entries }));
  }

  patchFontEntry(index: number, patch: Partial<FontEntry>): void {
    const entries = this.fontEntries.map((e, i) => i === index ? { ...e, ...patch } : e);
    this.custom.update(c => ({ ...c, fontEntries: entries }));
  }

  fontRoleLabel(index: number): string {
    const labels = ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary'];
    return labels[index] ?? `Font ${index + 1}`;
  }

  fontOptionsFor(lang: string): { label: string; value: string }[] {
    if (lang === 'Arabic') return ARABIC_FONT_OPTIONS;
    return FONT_OPTIONS;
  }

  accentOf(key: string): string { return ACCENT_MAP[key] ?? '#0ea5e9'; }
  selectPersonality(key: string): void { this.svc.setActive(key); }

  applyPreset(): void {
    const p = this.svc.activePersonality();
    this.svc.applyPersonality(p);
    this._applyPrimePreset(p.primePreset, p.primePrimary, p.primeSurface, p.primeDark);
  }

  patchCustom(patch: Partial<CustomPersonality>): void {
    this.custom.update(c => ({ ...c, ...patch }));

    // ── Step 4: sync shape fields to ThemeConfigurationStore ──────────────
    if (patch.shape !== undefined || patch.buttonShape !== undefined) {
      this.themeStore.updateShape({
        ...(patch.shape       !== undefined ? { globalShape: patch.shape }       : {}),
        ...(patch.cardStyle   !== undefined ? { cardStyle:   patch.cardStyle }   : {}),
      });
      if (patch.buttonShape !== undefined) {
        this.themeStore.updateButton({ shape: patch.buttonShape });
      }
    }
  }
  patchTypography(patch: Partial<TypographyTokens>): void {
    this.custom.update(c => ({ ...c, typography: { ...c.typography, ...patch } }));
  }
  patchColorZones(patch: Partial<ColorZones>): void {
    this.custom.update(c => ({ ...c, colorZones: { ...c.colorZones, ...patch } }));
  }
  patchComponentDetails(patch: Partial<ComponentDetails>): void {
    this.custom.update(c => ({ ...c, componentDetails: { ...c.componentDetails, ...patch } }));

    // ── Step 5A: sync button fields to ThemeConfigurationStore ────────────
    const btnPatch: Record<string, unknown> = {};
    if (patch.buttonSize    !== undefined) btnPatch['size']    = patch.buttonSize;
    if (patch.buttonShadow  !== undefined) btnPatch['shadow']  = patch.buttonShadow;
    if (patch.buttonIconPos !== undefined) btnPatch['iconPos'] = patch.buttonIconPos;
    if (Object.keys(btnPatch).length) this.themeStore.updateButton(btnPatch as any);
  }

  applyCustom(): void {
    const c = this.custom();
    this.svc.saveCustom(c);
    this.svc.applyPersonality(tokensFromCustom(c));
    this._applyPrimePreset(c.primePreset, c.primePrimary, c.primeSurface, c.primeDark);
    applyComponentDetails(c.componentDetails, document.documentElement);
    applyColorZones(c.colorZones, document.documentElement);
  }

  // ── Live preview computed styles ──────────────────────────────────────────

  readonly previewDialogStyle = computed(() => {
    const c = this.custom();
    const cd = c.componentDetails;
    const isPopup = c.dialogStyle === 'popup';

    // الـ popup style بيستخدم gradient border عن طريق background-clip trick
    const borderStyle = isPopup
      ? 'none'  // الـ border الفعلي بيتعمل في الـ SCSS عن طريق ::before pseudo-element
      : DIALOG_BORDER_MAP[c.dialogStyle];

    const baseStyle: Record<string, string> = {
      borderRadius: DIALOG_RADIUS[c.shape],
      border:       borderStyle,
      width:        '380px',
      minWidth:     '280px',
      maxWidth:     '95%',
      // CSS vars scoped على الـ dialog element
      '--app-dialog-radius':        DIALOG_RADIUS[c.shape],
      '--app-dialog-border':        borderStyle,
      '--app-dialog-header-bg':     DIALOG_HEADER_BG[c.dialogStyle],
      '--app-dialog-header-color':  DIALOG_HEADER_COLOR[c.dialogStyle],
      '--app-dialog-header-height': DIALOG_HEADER_HEIGHT_MAP[cd.dialogHeaderHeight],
      '--app-btn-radius':           BTN_RADIUS[c.buttonShape],
    };

    if (isPopup) {
      // gradient border عن طريق outline + box-shadow cascade
      baseStyle['boxShadow'] = `0 0 0 2px transparent, 0 14px 40px rgba(0,0,0,0.15)`;
      baseStyle['backgroundImage'] = 'none';
      // CSS var عشان الـ SCSS يعرف إنه popup mode
      baseStyle['--app-dialog-is-popup'] = '1';
    }

    return baseStyle;
  });

  readonly previewDialogHeaderStyle = computed<Record<string, string>>(() => {
    const cd = this.custom().componentDetails;
    return {
      // نطبق الـ header styles على الـ span جوا ng-template
      // الـ background والـ color بيتحكم فيهم الـ CSS vars اللي اتحطوا في previewDialogStyle
      minHeight:   DIALOG_HEADER_HEIGHT_MAP[cd.dialogHeaderHeight],
      display:     'flex',
      alignItems:  'center',
      width:       '100%',
    };
  });

  readonly previewBtnRadius = computed<string>(() => BTN_RADIUS[this.custom().buttonShape]);

  readonly previewBtnShadow = computed<string>(() => {
    const map: Record<ButtonShadow, string> = {
      none: 'none', soft: '0 2px 8px rgba(0,0,0,0.12)', lifted: '0 4px 16px rgba(0,0,0,0.2)',
    };
    return map[this.custom().componentDetails.buttonShadow];
  });

  readonly previewInputRadius = computed<string>(() => SHAPE_RADIUS[this.custom().shape]);

  readonly previewCardStyle = computed(() => ({
    borderRadius: CARD_RADIUS[this.custom().shape],
    border:       CARD_BORDER[this.custom().cardStyle],
    boxShadow:    CARD_SHADOW[this.custom().cardStyle],
    background:   CARD_BG[this.custom().cardStyle],
  }));

  readonly previewTableConfig = computed(() => {
    const cd = this.custom().componentDetails;
    const sepMap: Record<TableRowSeparator, string> = {
      none: 'none', thin: '1px solid rgba(0,0,0,0.08)',
      thick: '2px solid rgba(0,0,0,0.12)', colored: '1px solid var(--primary-color)',
    };
    return {
      radius:       SHAPE_RADIUS[this.custom().shape],
      striped:      this.custom().tableStyle === 'striped',
      bordered:     this.custom().tableStyle === 'bordered',
      minimal:      this.custom().tableStyle === 'minimal',
      rowSeparator: sepMap[cd.tableRowSeparator],
      colSeparator: cd.tableColumnSeparator,
      headerBg:     TABLE_HEADER_STYLE_BG[cd.tableHeaderStyle],
      headerColor:  cd.tableHeaderStyle === 'gradient' ? '#fff' : 'var(--text-color-secondary)',
    };
  });

  // ── Full demo page (expanded preview) ─────────────────────────────────────

  /** Primary font family pulled from the first font entry */
  readonly previewFontFamily = computed<string>(() => {
    const entries = this.custom().fontEntries?.length ? this.custom().fontEntries : DEFAULT_FONT_ENTRIES;
    return entries[0]?.font ?? "'Lato', sans-serif";
  });

  /** Body background for the full demo page */
  readonly previewBodyBg = computed<string>(() =>
    this.custom().colorZones.bodyBg || 'var(--surface-ground)'
  );

  /** Card style for the demo page's content card */
  readonly previewFullCardStyle = computed(() => {
    const c = this.custom();
    return {
      borderRadius: CARD_RADIUS[c.shape],
      border:       CARD_BORDER[c.cardStyle],
      boxShadow:    CARD_SHADOW[c.cardStyle],
      background:   c.colorZones.cardBg || CARD_BG[c.cardStyle],
    };
  });

  /** Enabled nav items for the topbar, in order */
  readonly previewNavItems = computed<TopbarNavItem[]>(() =>
    this.custom().componentDetails.topbarNavItems.filter(i => i.enabled)
  );

  /** Sidebar width in px for the full demo page (wider than the mini preview) */
  readonly previewFullSidebarWidth = computed<string>(() => {
    const cd = this.custom().componentDetails;
    if (cd.sidebarIconsOnly) return '56px';
    const widthMap: Record<SidebarWidth, string> = { narrow: '180px', normal: '220px', wide: '260px' };
    return widthMap[cd.sidebarWidth];
  });

  /** Copy the current personality's CSS custom properties into the preview iframe's document. */
  private _syncCssVarsToIframe(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const iframeEl = this.previewFrame?.nativeElement;
    const iframeDoc = iframeEl?.contentDocument;
    const iframeRoot = iframeDoc?.documentElement;
    if (!iframeRoot) return;

    const sourceStyle = getComputedStyle(document.documentElement);
    const targetStyle = document.documentElement.style;

    // Copy every custom property (--xxx) defined on the host's root element.
    for (let i = 0; i < targetStyle.length; i++) {
      const prop = targetStyle[i];
      if (prop.startsWith('--')) {
        iframeRoot.style.setProperty(prop, sourceStyle.getPropertyValue(prop));
      }
    }

    // Mirror dark-mode class so the preview matches the host theme.
    const isDark = document.documentElement.classList.contains('app-dark');
    iframeRoot.classList.toggle('app-dark', isDark);
  }

  private _applyPrimePreset(
    preset: 'Aura' | 'Lara' | 'Nora',
    primary: string,
    surface: string,
    dark: boolean
  ): void {
    this.settingsService.updatePreference('darkMode', dark);
    this.settingsService.updatePreference('theme', preset);
    this.settingsService.updatePreference('primaryColor', primary);

    const presetObj     = PRESETS[preset];
    const presetPalette = (presetObj as any).primitive;
    const primaryPalette = presetPalette?.[primary] ?? {};

    const ext = {
      semantic: {
        primary: primaryPalette,
        colorScheme: {
          light: {
            primary:   { color: '{primary.500}', contrastColor: '#fff', hoverColor: '{primary.600}', activeColor: '{primary.700}' },
            highlight: { background: '{primary.50}', focusBackground: '{primary.100}', color: '{primary.700}', focusColor: '{primary.800}' },
          },
          dark: {
            primary:   { color: '{primary.400}', contrastColor: '{surface.900}', hoverColor: '{primary.300}', activeColor: '{primary.200}' },
            highlight: { background: 'color-mix(in srgb, {primary.400}, transparent 84%)', focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)', color: 'rgba(255,255,255,.87)', focusColor: 'rgba(255,255,255,.87)' },
          },
        },
      },
    };

    const surfaces: Record<string, Record<string, string>> = {
      slate: { 0:'#fff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
      zinc:  { 0:'#fff',50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b' },
      gray:  { 0:'#fff',50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
    };

    const surfacePalette = surfaces[surface] ?? surfaces['slate'];
    $t().preset(presetObj).preset(ext).surfacePalette(surfacePalette).use({ useDefaultOptions: true });
    this.settingsService.updatePreference('surface', surface);
  }
}