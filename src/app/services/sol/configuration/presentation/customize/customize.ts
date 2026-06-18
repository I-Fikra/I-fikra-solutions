import {
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

import { PersonalityPickerComponent } from '@/app/foundation/core/theme-builder/personality-picker/personality-picker.component';
import { DemoLauncherService } from '@/app/foundation/core/theme-builder/demo-launcher.service';
import {
  LayoutService,
  AppConfig
} from '@/app/foundation/core/layout/service/layout.service';
import { SettingsService } from '@/app/foundation/core/settings/settings.service';

// ── Preset map ───────────────────────────────────────────────────────────────
const presets = { Aura, Lara, Nora } as const;
type PresetKey = keyof typeof presets;

// ── Palette types ─────────────────────────────────────────────────────────────
type ColorPalette = Partial<
  Record<
    | '0'
    | '50'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | '950',
    string
  >
>;

interface NamedPalette {
  name: string;
  palette?: ColorPalette;
}

// ── Theme presets (full combinations) ────────────────────────────────────────
export interface ThemeBundle {
  key: string;
  label: string;
  description: string;
  icon: string;
  preset: PresetKey;
  primary: string;
  surface: string;
  dark: boolean;
  previewBg: string;
  previewAccent: string;
}

export const THEME_BUNDLES: ThemeBundle[] = [
  {
    key: 'simw-default',
    label: 'SIMW Default',
    description:
      'The official SIMW design — topbar, floating sidebar, data table with row actions, and detail cards.',
    icon: 'pi pi-anchor',
    preset: 'Aura',
    primary: 'sky',
    surface: 'slate',
    dark: false,
    previewBg: '#f8fafc',
    previewAccent: '#0ea5e9'
  },
  {
    key: 'aura-emerald',
    label: 'Aura Emerald',
    description:
      'A fresh green palette built on Aura — clean and modern for data-heavy dashboards.',
    icon: 'pi pi-leaf',
    preset: 'Aura',
    primary: 'emerald',
    surface: 'slate',
    dark: false,
    previewBg: '#f0fdf4',
    previewAccent: '#10b981'
  },
  {
    key: 'aura-violet',
    label: 'Aura Violet',
    description:
      'Rich purple tones on Aura — great for creative or analytics platforms.',
    icon: 'pi pi-star',
    preset: 'Aura',
    primary: 'violet',
    surface: 'slate',
    dark: false,
    previewBg: '#f5f3ff',
    previewAccent: '#7c3aed'
  },
  {
    key: 'aura-rose',
    label: 'Aura Rose',
    description: 'Warm rose accents on Aura — welcoming and energetic.',
    icon: 'pi pi-heart',
    preset: 'Aura',
    primary: 'rose',
    surface: 'slate',
    dark: false,
    previewBg: '#fff1f2',
    previewAccent: '#f43f5e'
  },
  {
    key: 'lara-blue',
    label: 'Lara Blue',
    description:
      'Classic Lara preset with a trustworthy blue — a solid enterprise look.',
    icon: 'pi pi-building',
    preset: 'Lara',
    primary: 'blue',
    surface: 'gray',
    dark: false,
    previewBg: '#eff6ff',
    previewAccent: '#3b82f6'
  },
  {
    key: 'lara-teal',
    label: 'Lara Teal',
    description:
      'Lara preset with refreshing teal accents — ideal for health or finance apps.',
    icon: 'pi pi-chart-line',
    preset: 'Lara',
    primary: 'teal',
    surface: 'gray',
    dark: false,
    previewBg: '#f0fdfa',
    previewAccent: '#14b8a6'
  },
  {
    key: 'lara-amber',
    label: 'Lara Amber',
    description: 'Warm amber highlights on Lara — bold and attention-grabbing.',
    icon: 'pi pi-sun',
    preset: 'Lara',
    primary: 'amber',
    surface: 'stone',
    dark: false,
    previewBg: '#fffbeb',
    previewAccent: '#f59e0b'
  },
  {
    key: 'nora-indigo',
    label: 'Nora Indigo',
    description:
      'Sharp Nora preset with deep indigo — professional and precise.',
    icon: 'pi pi-shield',
    preset: 'Nora',
    primary: 'indigo',
    surface: 'zinc',
    dark: false,
    previewBg: '#eef2ff',
    previewAccent: '#6366f1'
  },
  {
    key: 'aura-sky-dark',
    label: 'Aura Night',
    description:
      'Dark mode Aura with sky blue accents — sleek and easy on the eyes.',
    icon: 'pi pi-moon',
    preset: 'Aura',
    primary: 'sky',
    surface: 'slate',
    dark: true,
    previewBg: '#0f172a',
    previewAccent: '#0ea5e9'
  },
  {
    key: 'aura-violet-dark',
    label: 'Aura Dark Violet',
    description: 'Dark Aura with vivid violet — immersive and modern.',
    icon: 'pi pi-eye',
    preset: 'Aura',
    primary: 'violet',
    surface: 'soho',
    dark: true,
    previewBg: '#1a1a2e',
    previewAccent: '#7c3aed'
  },
  {
    key: 'lara-blue-dark',
    label: 'Lara Dark',
    description:
      'Dark Lara with classic blue — a familiar enterprise feel in dark mode.',
    icon: 'pi pi-desktop',
    preset: 'Lara',
    primary: 'blue',
    surface: 'viva',
    dark: true,
    previewBg: '#111827',
    previewAccent: '#3b82f6'
  },
  {
    key: 'nora-teal-dark',
    label: 'Nora Dark Teal',
    description: 'Dark Nora with teal accents — minimal and focused.',
    icon: 'pi pi-code',
    preset: 'Nora',
    primary: 'teal',
    surface: 'ocean',
    dark: true,
    previewBg: '#0c1920',
    previewAccent: '#14b8a6'
  }
];

// ── Surfaces list ─────────────────────────────────────────────────────────────
const SURFACES: NamedPalette[] = [
  {
    name: 'slate',
    palette: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    }
  },
  {
    name: 'gray',
    palette: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    }
  },
  {
    name: 'zinc',
    palette: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b'
    }
  },
  {
    name: 'neutral',
    palette: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a'
    }
  },
  {
    name: 'stone',
    palette: {
      0: '#ffffff',
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09'
    }
  },
  {
    name: 'soho',
    palette: {
      0: '#ffffff',
      50: '#ececec',
      100: '#dedfdf',
      200: '#c4c4c6',
      300: '#adaeb0',
      400: '#97979b',
      500: '#7f8084',
      600: '#6a6b70',
      700: '#55565b',
      800: '#3f4046',
      900: '#2c2c34',
      950: '#16161d'
    }
  },
  {
    name: 'viva',
    palette: {
      0: '#ffffff',
      50: '#f3f3f3',
      100: '#e7e7e8',
      200: '#cfd0d0',
      300: '#b7b8b9',
      400: '#9fa1a1',
      500: '#87898a',
      600: '#6e7173',
      700: '#565a5b',
      800: '#3e4244',
      900: '#262b2c',
      950: '#0e1315'
    }
  },
  {
    name: 'ocean',
    palette: {
      0: '#ffffff',
      50: '#fbfcfc',
      100: '#F7F9F8',
      200: '#EFF3F2',
      300: '#DADEDD',
      400: '#B1B7B6',
      500: '#828787',
      600: '#5F7274',
      700: '#415B61',
      800: '#29444E',
      900: '#183240',
      950: '#0c1920'
    }
  }
];

// ── Customize tabs ────────────────────────────────────────────────────────────
type CustomizeTabKey = 'themes' | 'fine-tune' | 'personality' | 'color-groups';

interface CustomizeTab {
  key: CustomizeTabKey;
  label: string;
  icon: string;
}

// ── Color Group for client-defined palettes ───────────────────────────────────
export interface ColorGroup {
  id: string;
  name: string;
  colors: string[];
  activeIndex: number;
}

@Component({
  selector: 'app-customize',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ToggleSwitchModule,
    PersonalityPickerComponent
  ],
  templateUrl: './customize.html',
  styleUrl: './customize.scss',
  encapsulation: ViewEncapsulation.None
})
export class Customize implements OnInit {
  // ── Injections ──────────────────────────────────────────────────────────────
  readonly layoutService = inject(LayoutService);
  readonly settingsService = inject(SettingsService);
  readonly primeConfig = inject(PrimeNG);
  readonly messageService = inject(MessageService);
  readonly demoLauncher = inject(DemoLauncherService);
  private readonly sanitizer = inject(DomSanitizer);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly themeApplied = output<void>();

  // ── Customize tabs ──────────────────────────────────────────────────────────
  readonly customizeTabs: CustomizeTab[] = [
    { key: 'personality', label: 'Personality', icon: 'pi pi-sparkles' },
    { key: 'color-groups', label: 'Color Groups', icon: 'pi pi-th-large' }
  ];

  activeCustomizeTab = signal<CustomizeTabKey>('themes');
  activeBuilderSection = signal<string>('shape');

  readonly builderSections = [
    { key: 'login',   icon: 'pi pi-sign-in',         label: 'Login'   },
    { key: 'sidebar', icon: 'pi pi-list',            label: 'Sidebar' },
    { key: 'topbar',  icon: 'pi pi-bars',            label: 'Topbar'  },
    { key: 'dialog',  icon: 'pi pi-window-maximize', label: 'Dialog'  },
    { key: 'button',  icon: 'pi pi-send',            label: 'Button'  },
    { key: 'table',   icon: 'pi pi-table',           label: 'Table'   },
    { key: 'font',    icon: 'pi pi-font',            label: 'Font'    },
    { key: 'shape',   icon: 'pi pi-stop',            label: 'Shape'   },
  ];

  /** Live iframe URL — changes with active section so the demo shows the right component */
  private readonly DEMO_BASE = 'https://platform-demo-chi.vercel.app';

  readonly livePreviewUrl = computed<SafeResourceUrl>(() => {
    const section = this.activeBuilderSection();
    const url = `${this.DEMO_BASE}/?preview=${section}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ── Theme (Templates) state ──────────────────────────────────────────────────
  readonly themeBundles = THEME_BUNDLES;
  activeThemeKey = signal<string>('simw-default');

  // ── Appearance state ────────────────────────────────────────────────────────
  readonly surfaces = SURFACES;
  readonly presetNames = Object.keys(presets) as PresetKey[];
  readonly primaryColors = computed(() => this._buildPrimaryColors());

  selectedPreset = computed(
    () => this.layoutService.layoutConfig().preset as PresetKey
  );
  selectedPrimary = computed(() => this.layoutService.layoutConfig().primary);
  selectedSurface = computed(() => this.layoutService.layoutConfig().surface);
  isDark = computed(() => this.layoutService.layoutConfig().darkTheme);

  readonly menuModeOptions = [
    { label: 'Static', value: 'static' },
    { label: 'Overlay', value: 'overlay' }
  ];

  menuMode = computed(() => this.layoutService.layoutConfig().menuMode);

  // ── Preview / Reset ─────────────────────────────────────────────────────────
  private _configSnapshot: AppConfig | null = null;
  isPreviewMode = signal(false);

  // ── Preview Panel Expand ─────────────────────────────────────────────────────
  previewExpanded = signal(false);

  togglePreviewExpanded(): void {
    this.previewExpanded.update(v => !v);
  }

  // ── Color Groups ─────────────────────────────────────────────────────────────
  colorGroups = signal<ColorGroup[]>([
    {
      id: 'cg-1',
      name: 'Brand Colors',
      colors: ['#0ea5e9', '#6366f1', '#10b981'],
      activeIndex: 0
    }
  ]);

  newGroupName = signal('');

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const cfg = this.layoutService.layoutConfig();
    const matched = THEME_BUNDLES.find(
      (t) =>
        t.preset === cfg.preset &&
        t.primary === cfg.primary &&
        t.dark === cfg.darkTheme
    );
    if (matched) this.activeThemeKey.set(matched.key);
  }

  // ── Theme bundles ────────────────────────────────────────────────────────────
  applyThemeBundle(bundle: ThemeBundle): void {
    this.activeThemeKey.set(bundle.key);
    const preset = presets[bundle.preset];
    const surfacePalette = SURFACES.find(
      (s) => s.name === bundle.surface
    )?.palette;
    this.layoutService.layoutConfig.set({
      ...this.layoutService.layoutConfig(),
      preset: bundle.preset,
      primary: bundle.primary,
      surface: bundle.surface,
      darkTheme: bundle.dark
    });
    const ext = this._getPresetExt(bundle.primary, bundle.preset);
    $t()
      .preset(preset)
      .preset(ext)
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
    this.themeApplied.emit();
    this.messageService.add({
      severity: 'success',
      summary: 'Theme Applied',
      detail: `"${bundle.label}" theme applied.`
    });
  }

  // ── Appearance ────────────────────────────────────────────────────────────────
  onPresetChange(presetName: string): void {
    this.settingsService.updatePreference('theme', presetName as any);
    const preset = presets[presetName as PresetKey];
    const surfacePalette = SURFACES.find(
      (s) => s.name === this.selectedSurface()
    )?.palette;
    const ext = this._getPresetExt(
      this.selectedPrimary(),
      presetName as PresetKey
    );
    $t()
      .preset(preset)
      .preset(ext)
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
  }

  updatePrimary(color: NamedPalette, event: MouseEvent): void {
    this.settingsService.updatePreference('primaryColor', color.name as any);
    const ext = this._getPresetExt(color.name, this.selectedPreset());
    updatePreset(ext);
    event.stopPropagation();
  }

  updateSurface(surface: NamedPalette, event: MouseEvent): void {
    this.settingsService.updatePreference('surface', surface.name as any);
    if (surface.palette) updateSurfacePalette(surface.palette as any);
    event.stopPropagation();
  }

  toggleDark(value: boolean): void {
    this.layoutService.layoutConfig.update((c) => ({ ...c, darkTheme: value }));
  }

  onMenuModeChange(mode: string): void {
    this.settingsService.updatePreference('menuMode', mode as any);
  }

  // ── Preview / Reset ──────────────────────────────────────────────────────────
  startPreview(): void {
    this._configSnapshot = { ...this.layoutService.layoutConfig() };
    this.isPreviewMode.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Preview Mode',
      detail: 'Changes applied to all pages. Click "Reset" to undo.'
    });
  }

  resetToSnapshot(): void {
    if (!this._configSnapshot) return;
    const snap = this._configSnapshot;
    this.layoutService.layoutConfig.set(snap);
    const preset = presets[snap.preset as PresetKey];
    const surfacePalette = SURFACES.find(
      (s) => s.name === snap.surface
    )?.palette;
    const ext = this._getPresetExt(snap.primary, snap.preset as PresetKey);
    $t()
      .preset(preset)
      .preset(ext)
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
    this.isPreviewMode.set(false);
    this._configSnapshot = null;
    this.messageService.add({
      severity: 'warn',
      summary: 'Reset Done',
      detail: 'All appearance settings restored.'
    });
  }

  // ── Color Groups ─────────────────────────────────────────────────────────────
  addColorGroup(): void {
    const name = this.newGroupName().trim();
    if (!name) return;
    this.colorGroups.update((groups) => [
      ...groups,
      {
        id: `cg-${Date.now()}`,
        name,
        colors: ['#6366f1'],
        activeIndex: 0
      }
    ]);
    this.newGroupName.set('');
  }

  removeColorGroup(id: string): void {
    this.colorGroups.update((groups) => groups.filter((g) => g.id !== id));
  }

  addColorToGroup(groupId: string): void {
    this.colorGroups.update((groups) =>
      groups.map((g) =>
        g.id === groupId ? { ...g, colors: [...g.colors, '#94a3b8'] } : g
      )
    );
  }

  removeColorFromGroup(groupId: string, index: number): void {
    this.colorGroups.update((groups) =>
      groups.map((g) =>
        g.id === groupId
          ? { ...g, colors: g.colors.filter((_, i) => i !== index) }
          : g
      )
    );
  }

  updateGroupColor(groupId: string, index: number, value: string): void {
    this.colorGroups.update((groups) =>
      groups.map((g) =>
        g.id === groupId
          ? { ...g, colors: g.colors.map((c, i) => (i === index ? value : c)) }
          : g
      )
    );
  }

  setActiveGroupColor(groupId: string, index: number): void {
    this.colorGroups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, activeIndex: index } : g))
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private _buildPrimaryColors(): NamedPalette[] {
    const presetKey = this.selectedPreset();
    const presetPalette = (presets[presetKey] as any).primitive ?? {};
    const colorNames = [
      'emerald',
      'green',
      'lime',
      'orange',
      'amber',
      'yellow',
      'teal',
      'cyan',
      'sky',
      'blue',
      'indigo',
      'violet',
      'purple',
      'fuchsia',
      'pink',
      'rose'
    ];
    const result: NamedPalette[] = [{ name: 'noir', palette: {} }];
    colorNames.forEach((name) =>
      result.push({ name, palette: presetPalette[name] as ColorPalette })
    );
    return result;
  }

  private _getPresetExt(primaryName: string, preset: PresetKey): any {
    const color = this._buildPrimaryColors().find(
      (c) => c.name === primaryName
    );
    if (!color) return {};
    if (primaryName === 'noir') {
      return {
        semantic: {
          primary: {
            50: '{surface.50}',
            100: '{surface.100}',
            200: '{surface.200}',
            300: '{surface.300}',
            400: '{surface.400}',
            500: '{surface.500}',
            600: '{surface.600}',
            700: '{surface.700}',
            800: '{surface.800}',
            900: '{surface.900}',
            950: '{surface.950}'
          },
          colorScheme: {
            light: {
              primary: {
                color: '{primary.950}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.800}',
                activeColor: '{primary.700}'
              },
              highlight: {
                background: '{primary.950}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff'
              }
            },
            dark: {
              primary: {
                color: '{primary.50}',
                contrastColor: '{primary.950}',
                hoverColor: '{primary.200}',
                activeColor: '{primary.300}'
              },
              highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.300}',
                color: '{primary.950}',
                focusColor: '{primary.950}'
              }
            }
          }
        }
      };
    }
    if (preset === 'Nora') {
      return {
        semantic: {
          primary: color.palette,
          colorScheme: {
            light: {
              primary: {
                color: '{primary.600}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.700}',
                activeColor: '{primary.800}'
              },
              highlight: {
                background: '{primary.600}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff'
              }
            },
            dark: {
              primary: {
                color: '{primary.500}',
                contrastColor: '{surface.900}',
                hoverColor: '{primary.400}',
                activeColor: '{primary.300}'
              },
              highlight: {
                background: '{primary.500}',
                focusBackground: '{primary.400}',
                color: '{surface.900}',
                focusColor: '{surface.900}'
              }
            }
          }
        }
      };
    }
    return {
      semantic: {
        primary: color.palette,
        colorScheme: {
          light: {
            primary: {
              color: '{primary.500}',
              contrastColor: '#ffffff',
              hoverColor: '{primary.600}',
              activeColor: '{primary.700}'
            },
            highlight: {
              background: '{primary.50}',
              focusBackground: '{primary.100}',
              color: '{primary.700}',
              focusColor: '{primary.800}'
            }
          },
          dark: {
            primary: {
              color: '{primary.400}',
              contrastColor: '{surface.900}',
              hoverColor: '{primary.300}',
              activeColor: '{primary.200}'
            },
            highlight: {
              background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
              focusBackground:
                'color-mix(in srgb, {primary.400}, transparent 76%)',
              color: 'rgba(255,255,255,.87)',
              focusColor: 'rgba(255,255,255,.87)'
            }
          }
        }
      }
    };
  }

  // ── Demo Launcher ─────────────────────────────────────────────────────────
  openDemo(): void {
    this.demoLauncher.openDemo();
  }
}