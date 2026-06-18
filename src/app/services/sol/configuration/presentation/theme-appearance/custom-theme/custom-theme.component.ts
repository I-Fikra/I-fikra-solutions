import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { SettingsService } from '@/app/foundation/core/settings/settings.service';
import { ThemeAppearanceStore } from '../theme-appearance.store';

// ── Types ─────────────────────────────────────────────────────────────────────

type PresetName = 'Aura' | 'Lara' | 'Nora';


export interface SurfacePalette {
  name: string;
  palette: Record<string, string>;
}

export interface ColorSwatch {
  name: string;
  palette?: Record<string, string>;
}

/** A user-added custom swatch (single hex, auto-generates a palette) */
export interface CustomSwatch {
  name: string;  // e.g. "custom-primary-0"
  hex: string;   // e.g. "#e63a7b"
}

/** A named colour option for body zones */
export interface BodyColorOption {
  label: string;
  hex: string;
}

const presets = { Aura, Lara, Nora } as const;

// ── Palette generator ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generatePalette(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex);
  const stops: Record<string, [number, number, number]> = {
    0:   [255, 255, 255],
    50:  [mix(r,255,.85), mix(g,255,.85), mix(b,255,.85)],
    100: [mix(r,255,.7),  mix(g,255,.7),  mix(b,255,.7)],
    200: [mix(r,255,.5),  mix(g,255,.5),  mix(b,255,.5)],
    300: [mix(r,255,.3),  mix(g,255,.3),  mix(b,255,.3)],
    400: [mix(r,255,.15), mix(g,255,.15), mix(b,255,.15)],
    500: [r, g, b],
    600: [mix(r,0,.15),   mix(g,0,.15),   mix(b,0,.15)],
    700: [mix(r,0,.3),    mix(g,0,.3),    mix(b,0,.3)],
    800: [mix(r,0,.5),    mix(g,0,.5),    mix(b,0,.5)],
    900: [mix(r,0,.7),    mix(g,0,.7),    mix(b,0,.7)],
    950: [mix(r,0,.85),   mix(g,0,.85),   mix(b,0,.85)]
  };
  const result: Record<string, string> = {};
  for (const [k, [cr, cg, cb]] of Object.entries(stops)) {
    result[k] = rgbToHex(cr, cg, cb);
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-ta-custom-theme',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  templateUrl: './custom-theme.component.html',
  styleUrl:    './custom-theme.component.scss'
})
export class TaCustomThemeComponent {

  private readonly layoutService   = inject(LayoutService);
  private readonly settingsService = inject(SettingsService);
  private readonly store           = inject(ThemeAppearanceStore);

  readonly saved = output<void>();

  // ── Preset names ──────────────────────────────────────────────────────────
  readonly presetNames: PresetName[] = ['Aura', 'Lara', 'Nora'];

  // ── Default surface swatches ──────────────────────────────────────────────
  readonly surfaces: SurfacePalette[] = [
    { name: 'slate',   palette: { 500: '#64748b' } },
    { name: 'gray',    palette: { 500: '#6b7280' } },
    { name: 'zinc',    palette: { 500: '#71717a' } },
    { name: 'neutral', palette: { 500: '#737373' } },
    { name: 'stone',   palette: { 500: '#78716c' } },
    { name: 'soho',    palette: { 500: '#7f8084' } },
    { name: 'viva',    palette: { 500: '#87898a' } },
    { name: 'ocean',   palette: { 500: '#828787' } }
  ];

  // ── Menu mode options ─────────────────────────────────────────────────────
  readonly menuModeOptions = [
    { label: 'Static',  value: 'static'  },
    { label: 'Overlay', value: 'overlay' }
  ];

  // ── Body color presets ────────────────────────────────────────────────────
  readonly bodyColorOptions: BodyColorOption[] = [
    { label: 'White',      hex: '#ffffff' },
    { label: 'Light Gray', hex: '#f8fafc' },
    { label: 'Slate 100',  hex: '#f1f5f9' },
    { label: 'Slate 200',  hex: '#e2e8f0' },
    { label: 'Slate 800',  hex: '#1e293b' },
    { label: 'Slate 900',  hex: '#0f172a' },
    { label: 'Zinc 900',   hex: '#18181b' },
    { label: 'Gray 900',   hex: '#111827' },
  ];

  // ── User-added custom swatches ────────────────────────────────────────────
  readonly customPrimaryColors = signal<CustomSwatch[]>([]);
  readonly customSurfaces      = signal<CustomSwatch[]>([]);
  readonly customBodyColors    = signal<CustomSwatch[]>([]);

  private customPrimaryCounter = 0;
  private customSurfaceCounter = 0;
  private customBodyCounter    = 0;

  // ── Body color selection ──────────────────────────────────────────────────
  readonly selectedBodyColor = signal<string>('#f8fafc');

  // ── Computed selections ───────────────────────────────────────────────────
  readonly selectedPreset   = computed(() => this.layoutService.layoutConfig().preset as PresetName);
  readonly selectedPrimary  = computed(() => this.layoutService.layoutConfig().primary);
  readonly selectedSurface  = computed(() => this.layoutService.layoutConfig().surface);
  readonly selectedMenuMode = computed(() => this.layoutService.layoutConfig().menuMode);

  // ── Default primary colour swatches from active preset ───────────────────
  readonly primaryColors = computed<ColorSwatch[]>(() => {
    const presetKey = this.selectedPreset() as keyof typeof presets;
    const primitive = (presets[presetKey] as any)?.primitive ?? {};
    const colorNames = [
      'emerald','green','lime','orange','amber','yellow',
      'teal','cyan','sky','blue','indigo','violet',
      'purple','fuchsia','pink','rose'
    ];
    const list: ColorSwatch[] = [{ name: 'noir', palette: {} }];
    colorNames.forEach(name => list.push({ name, palette: primitive[name] ?? {} }));
    return list;
  });

  // ── Swatch background helper ──────────────────────────────────────────────
  swatchBg(color: ColorSwatch): string {
    if (color.name === 'noir') return 'var(--text-color)';
    return (color.palette as any)?.['500'] ?? '#ccc';
  }

  // ── Add primary color ─────────────────────────────────────────────────────
  onAddPrimaryColor(event: Event): void {
    const hex = (event.target as HTMLInputElement).value;
    if (!hex) return;
    const name = `custom-primary-${this.customPrimaryCounter++}`;
    this.customPrimaryColors.update(list => [...list, { name, hex }]);
    const palette = generatePalette(hex);
    this.applyCustomPrimaryPalette(name, palette);
  }

  removeCustomPrimary(name: string): void {
    this.customPrimaryColors.update(list => list.filter(c => c.name !== name));
    if (this.selectedPrimary() === name) {
      this.onPrimaryChange(this.primaryColors()[1] ?? this.primaryColors()[0]);
    }
  }

  onCustomPrimaryChange(c: CustomSwatch): void {
    const palette = generatePalette(c.hex);
    this.applyCustomPrimaryPalette(c.name, palette);
  }

  private applyCustomPrimaryPalette(name: string, palette: Record<string, string>): void {
    this.settingsService.updatePreference('primaryColor', name);
    const color: ColorSwatch = { name, palette };
    updatePreset(this.buildPresetExt(color));
  }

  // ── Add surface color ─────────────────────────────────────────────────────
  onAddSurfaceColor(event: Event): void {
    const hex = (event.target as HTMLInputElement).value;
    if (!hex) return;
    const name = `custom-surface-${this.customSurfaceCounter++}`;
    this.customSurfaces.update(list => [...list, { name, hex }]);
    const palette = generatePalette(hex);
    this.applyCustomSurfacePalette(name, palette);
  }

  removeCustomSurface(name: string): void {
    this.customSurfaces.update(list => list.filter(c => c.name !== name));
    if (this.selectedSurface() === name) {
      this.onSurfaceChange(this.surfaces[0]);
    }
  }

  onCustomSurfaceChange(c: CustomSwatch): void {
    const palette = generatePalette(c.hex);
    this.applyCustomSurfacePalette(c.name, palette);
  }

  private applyCustomSurfacePalette(name: string, palette: Record<string, string>): void {
    this.settingsService.updatePreference('surface', name);
    updateSurfacePalette(palette);
  }

  // ── Body Color ────────────────────────────────────────────────────────────
  onBodyColorChange(hex: string): void {
    this.selectedBodyColor.set(hex);
    this.applyBodyColor();
  }

  onAddBodyColor(event: Event): void {
    const hex = (event.target as HTMLInputElement).value;
    if (!hex) return;
    const already = this.customBodyColors().some(c => c.hex === hex)
      || this.bodyColorOptions.some(c => c.hex === hex);
    if (!already) {
      const name = `custom-body-${this.customBodyCounter++}`;
      this.customBodyColors.update(list => [...list, { name, hex }]);
    }
  }

  removeCustomBodyColor(hex: string): void {
    this.customBodyColors.update(list => list.filter(c => c.hex !== hex));
  }

  private applyBodyColor(): void {
    const hex = this.selectedBodyColor();
    // Topbar background
    document.documentElement.style.setProperty('--app-topbar-bg', hex);
    // Sidebar background (overrides --surface-overlay used by .layout-sidebar)
    document.documentElement.style.setProperty('--surface-overlay', hex);
    // Main content / body background (used by body { background-color })
    document.documentElement.style.setProperty('--surface-ground', hex);
  }

  // ── Default primary change ────────────────────────────────────────────────
  onPrimaryChange(color: ColorSwatch): void {
    this.settingsService.updatePreference('primaryColor', color.name);
    updatePreset(this.buildPresetExt(color));
  }

  // ── Default surface change ────────────────────────────────────────────────
  onSurfaceChange(surface: SurfacePalette): void {
    this.settingsService.updatePreference('surface', surface.name);
    updateSurfacePalette(this.getFullSurfacePalette(surface.name));
  }

  // ── Preset change ─────────────────────────────────────────────────────────
  onPresetChange(name: PresetName): void {
    this.settingsService.updatePreference('theme', name);
    const preset = presets[name];
    const surfacePalette = this.getFullSurfacePalette(this.selectedSurface() ?? 'slate');
    $t()
      .preset(preset)
      .preset(this.buildPresetExt())
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
  }

  // ── Menu mode change ──────────────────────────────────────────────────────
  onMenuModeChange(mode: string): void {
    this.settingsService.updatePreference('menuMode', mode as any);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  save(): void {
    this.saved.emit();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private getFullSurfacePalette(name: string): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      slate:   { 0:'#fff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
      gray:    { 0:'#fff',50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
      zinc:    { 0:'#fff',50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b' },
      neutral: { 0:'#fff',50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a' },
      stone:   { 0:'#fff',50:'#fafaf9',100:'#f5f5f4',200:'#e7e5e4',300:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',700:'#44403c',800:'#292524',900:'#1c1917',950:'#0c0a09' },
      soho:    { 0:'#fff',50:'#ececec',100:'#dedfdf',200:'#c4c4c6',300:'#adaeb0',400:'#97979b',500:'#7f8084',600:'#6a6b70',700:'#55565b',800:'#3f4046',900:'#2c2c34',950:'#16161d' },
      viva:    { 0:'#fff',50:'#f3f3f3',100:'#e7e7e8',200:'#cfd0d0',300:'#b7b8b9',400:'#9fa1a1',500:'#87898a',600:'#6e7173',700:'#565a5b',800:'#3e4244',900:'#262b2c',950:'#0e1315' },
      ocean:   { 0:'#fff',50:'#fbfcfc',100:'#F7F9F8',200:'#EFF3F2',300:'#DADEDD',400:'#B1B7B6',500:'#828787',600:'#5F7274',700:'#415B61',800:'#29444E',900:'#183240',950:'#0c1920' }
    };
    const custom = this.customSurfaces().find(c => c.name === name);
    if (custom) return generatePalette(custom.hex);
    return map[name] ?? map['slate'];
  }

  private buildPresetExt(overrideColor?: ColorSwatch): any {
    const colorName = overrideColor?.name ?? this.selectedPrimary();
    const color = overrideColor ?? this.primaryColors().find(c => c.name === colorName);
    const preset = this.selectedPreset();

    if (!color || color.name === 'noir') {
      return {
        semantic: {
          primary: {
            50:'{surface.50}',100:'{surface.100}',200:'{surface.200}',
            300:'{surface.300}',400:'{surface.400}',500:'{surface.500}',
            600:'{surface.600}',700:'{surface.700}',800:'{surface.800}',
            900:'{surface.900}',950:'{surface.950}'
          },
          colorScheme: {
            light: { primary: { color:'{primary.950}', contrastColor:'#fff', hoverColor:'{primary.800}', activeColor:'{primary.700}' }, highlight: { background:'{primary.950}', focusBackground:'{primary.700}', color:'#fff', focusColor:'#fff' } },
            dark:  { primary: { color:'{primary.50}',  contrastColor:'{primary.950}', hoverColor:'{primary.200}', activeColor:'{primary.300}' }, highlight: { background:'{primary.50}', focusBackground:'{primary.300}', color:'{primary.950}', focusColor:'{primary.950}' } }
          }
        }
      };
    }

    if (preset === 'Nora') {
      return {
        semantic: {
          primary: color.palette,
          colorScheme: {
            light: { primary: { color:'{primary.600}', contrastColor:'#fff', hoverColor:'{primary.700}', activeColor:'{primary.800}' }, highlight: { background:'{primary.600}', focusBackground:'{primary.700}', color:'#fff', focusColor:'#fff' } },
            dark:  { primary: { color:'{primary.500}', contrastColor:'{surface.900}', hoverColor:'{primary.400}', activeColor:'{primary.300}' }, highlight: { background:'{primary.500}', focusBackground:'{primary.400}', color:'{surface.900}', focusColor:'{surface.900}' } }
          }
        }
      };
    }

    return {
      semantic: {
        primary: color.palette,
        colorScheme: {
          light: { primary: { color:'{primary.500}', contrastColor:'#fff', hoverColor:'{primary.600}', activeColor:'{primary.700}' }, highlight: { background:'{primary.50}', focusBackground:'{primary.100}', color:'{primary.700}', focusColor:'{primary.800}' } },
          dark:  { primary: { color:'{primary.400}', contrastColor:'{surface.900}', hoverColor:'{primary.300}', activeColor:'{primary.200}' }, highlight: { background:'color-mix(in srgb,{primary.400},transparent 84%)', focusBackground:'color-mix(in srgb,{primary.400},transparent 76%)', color:'rgba(255,255,255,.87)', focusColor:'rgba(255,255,255,.87)' } }
        }
      }
    };
  }
}