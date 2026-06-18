import {
  Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { ButtonModule }      from 'primeng/button';
import { InputTextModule }   from 'primeng/inputtext';
import { ToastModule }       from 'primeng/toast';
import { TooltipModule }     from 'primeng/tooltip';
import { DialogModule }      from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService }    from 'primeng/api';

import { LayoutService }     from '@/app/foundation/core/layout/service/layout.service';
import { SettingsService }   from '@/app/foundation/core/settings/settings.service';
import {
  ThemeBuilderService,
  CustomTheme,
  ColorPalette,
  ColorShade,
  BorderRadiusPreset,
  DensityPreset,
  ShadowPreset,
  FontPreset,
  TypeScaleRatio,
  TypographySettings,
  TypographyBodySettings,
  BORDER_RADIUS_MAP,
  DENSITY_MAP,
  SHADOW_MAP,
  FONT_MAP,
  SCALE_RATIO_MAP,
  DEFAULT_THEME,
  DEFAULT_TYPOGRAPHY,
  generatePaletteFromHex,
  isValidHex,
} from './theme-builder.service';

// ── Named palette data (same as app.configurator) ────────────────────────────

const PRESETS = { Aura, Lara, Nora } as const;
type PresetKey = keyof typeof PRESETS;

type NamedPalette = { name: string; palette?: Partial<ColorPalette> };

const SURFACES: NamedPalette[] = [
  { name: 'slate',   palette: { '50':'#f8fafc','100':'#f1f5f9','200':'#e2e8f0','300':'#cbd5e1','400':'#94a3b8','500':'#64748b','600':'#475569','700':'#334155','800':'#1e293b','900':'#0f172a','950':'#020617' } },
  { name: 'gray',    palette: { '50':'#f9fafb','100':'#f3f4f6','200':'#e5e7eb','300':'#d1d5db','400':'#9ca3af','500':'#6b7280','600':'#4b5563','700':'#374151','800':'#1f2937','900':'#111827','950':'#030712' } },
  { name: 'zinc',    palette: { '50':'#fafafa','100':'#f4f4f5','200':'#e4e4e7','300':'#d4d4d8','400':'#a1a1aa','500':'#71717a','600':'#52525b','700':'#3f3f46','800':'#27272a','900':'#18181b','950':'#09090b' } },
  { name: 'neutral', palette: { '50':'#fafafa','100':'#f5f5f5','200':'#e5e5e5','300':'#d4d4d4','400':'#a3a3a3','500':'#737373','600':'#525252','700':'#404040','800':'#262626','900':'#171717','950':'#0a0a0a' } },
  { name: 'stone',   palette: { '50':'#fafaf9','100':'#f5f5f4','200':'#e7e5e4','300':'#d6d3d1','400':'#a8a29e','500':'#78716c','600':'#57534e','700':'#44403c','800':'#292524','900':'#1c1917','950':'#0c0a09' } },
  { name: 'soho',    palette: { '50':'#ececec','100':'#dedfdf','200':'#c4c4c6','300':'#adaeb0','400':'#97979b','500':'#7f8084','600':'#6a6b70','700':'#55565b','800':'#3f4046','900':'#2c2c34','950':'#16161d' } },
  { name: 'viva',    palette: { '50':'#f3f3f3','100':'#e7e7e8','200':'#cfd0d0','300':'#b7b8b9','400':'#9fa1a1','500':'#87898a','600':'#6e7173','700':'#565a5b','800':'#3e4244','900':'#262b2c','950':'#0e1315' } },
  { name: 'ocean',   palette: { '50':'#fbfcfc','100':'#F7F9F8','200':'#EFF3F2','300':'#DADEDD','400':'#B1B7B6','500':'#828787','600':'#5F7274','700':'#415B61','800':'#29444E','900':'#183240','950':'#0c1920' } },
];

const COLOR_SHADES: ColorShade[] = ['50','100','200','300','400','500','600','700','800','900','950'];

type TabKey = 'presets' | 'palette' | 'shape' | 'typography' | 'saved';

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-theme-builder',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, ToastModule, TooltipModule,
    DialogModule, ToggleSwitchModule,
  ],
  templateUrl: './theme-builder.component.html',
  styleUrls: ['./theme-builder.component.scss'],
})
export class ThemeBuilderComponent implements OnInit, OnDestroy {
  private layoutService  = inject(LayoutService);
  private settingsService = inject(SettingsService);
  private themeBuilderSvc = inject(ThemeBuilderService);
  private messageService  = inject(MessageService);
  private config          = inject(PrimeNG);
  private platformId      = inject(PLATFORM_ID);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  activeTab = signal<TabKey>('presets');
  tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'presets',    label: 'Presets',     icon: 'pi pi-th-large'   },
    { key: 'palette',    label: 'Palette',     icon: 'pi pi-palette'    },
    { key: 'shape',      label: 'Shape',       icon: 'pi pi-sliders-h'  },
    { key: 'typography', label: 'Typography',  icon: 'pi pi-text'       },
    { key: 'saved',      label: 'Saved',       icon: 'pi pi-bookmark'   },
  ];

  // ── Working copy of in-progress theme ─────────────────────────────────────
  draft = signal<Omit<CustomTheme, 'key' | 'label' | 'createdAt'>>({ ...DEFAULT_THEME });

  // ── Computed from layout service ─────────────────────────────────────────
  isDark        = computed(() => this.layoutService.layoutConfig().darkTheme);
  selectedPreset  = computed(() => this.layoutService.layoutConfig().preset as PresetKey);
  selectedPrimary = computed(() => this.layoutService.layoutConfig().primary);
  selectedSurface = computed(() => this.layoutService.layoutConfig().surface);

  // ── Named presets ─────────────────────────────────────────────────────────
  readonly presetNames = Object.keys(PRESETS) as PresetKey[];
  readonly surfaces = SURFACES;
  readonly allBorderRadii: BorderRadiusPreset[] = ['sharp', 'rounded', 'soft', 'pill'];
  readonly allDensities: DensityPreset[]  = ['compact', 'comfortable', 'spacious'];
  readonly allShadows: ShadowPreset[]     = ['none', 'subtle', 'medium', 'dramatic'];
  readonly allFonts: FontPreset[]         = ['default', 'mono', 'serif', 'rounded'];
  readonly fontMap = FONT_MAP;
  readonly shadowMap = SHADOW_MAP;
  readonly borderRadiusMap = BORDER_RADIUS_MAP;

  // ── Typography ────────────────────────────────────────────────────────────
  readonly scaleRatioMap = SCALE_RATIO_MAP;
  readonly allScaleRatios: TypeScaleRatio[] = ['1.067','1.125','1.200','1.250','1.333','1.414','1.500','1.618'];
  readonly fontWeightOptions = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  readonly allResponsiveScales: (TypeScaleRatio | 'inherit')[] = ['inherit', '1.067','1.125','1.200','1.250','1.333','1.414','1.500','1.618'];

  typography = signal<TypographySettings>({ ...DEFAULT_TYPOGRAPHY, body: { ...DEFAULT_TYPOGRAPHY.body } });

  primaryColors = computed<NamedPalette[]>(() => {
    const presetPalette = (PRESETS[this.selectedPreset()] as any).primitive ?? {};
    const names = ['emerald','green','lime','orange','amber','yellow','teal','cyan',
                   'sky','blue','indigo','violet','purple','fuchsia','pink','rose'];
    const result: NamedPalette[] = [{ name: 'noir', palette: {} }];
    names.forEach(n => result.push({ name: n, palette: presetPalette[n] }));
    return result;
  });

  // ── Custom palette section ─────────────────────────────────────────────────
  customHex        = signal('#0ea5e9');
  customHexInput   = signal('#0ea5e9');   // raw input (may be invalid)
  customPalette    = signal<ColorPalette | null>(null);
  paletteTarget    = signal<'primary' | 'surface'>('primary');
  readonly colorShades = COLOR_SHADES;

  hexInputValid = computed(() => isValidHex(this.customHexInput()));

  // ── Save dialog ───────────────────────────────────────────────────────────
  showSaveDialog  = signal(false);
  newThemeName    = signal('');

  // ── Saved themes ──────────────────────────────────────────────────────────
  savedThemes     = computed(() => this.themeBuilderSvc.themes());
  activeThemeKey  = computed(() => this.themeBuilderSvc.activeKey());

  // ── Import ────────────────────────────────────────────────────────────────
  showImportDialog = signal(false);
  importJson       = signal('');

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Seed draft from current config
    const cfg = this.layoutService.layoutConfig();
    this.draft.set({
      preset:      cfg.preset as PresetKey,
      primaryColor: cfg.primary ?? 'sky',
      surface:     cfg.surface ?? 'slate',
      darkMode:    cfg.darkTheme,
      borderRadius: 'rounded',
      density:     'comfortable',
      shadow:      'subtle',
      font:        'default',
    });
  }

  ngOnDestroy(): void { /* nothing */ }

  // ── Tab nav ───────────────────────────────────────────────────────────────

  setTab(key: TabKey): void { this.activeTab.set(key); }

  // ── PrimeNG preset ────────────────────────────────────────────────────────

  onPresetChange(name: string): void {
    this.settingsService.updatePreference('theme', name as any);
    const preset = PRESETS[name as PresetKey];
    const surfPalette = SURFACES.find(s => s.name === this.selectedSurface())?.palette;
    const ext = this._getPresetExt(this.selectedPrimary(), name as PresetKey);
    $t().preset(preset).preset(ext).surfacePalette(surfPalette).use({ useDefaultOptions: true });
    this.draft.update(d => ({ ...d, preset: name as PresetKey }));
  }

  // ── Primary / Surface named color ─────────────────────────────────────────

  updatePrimary(color: NamedPalette, event: MouseEvent): void {
    this.settingsService.updatePreference('primaryColor', color.name as any);
    const ext = this._getPresetExt(color.name, this.selectedPreset());
    updatePreset(ext);
    this.draft.update(d => ({ ...d, primaryColor: color.name }));
    event.stopPropagation();
  }

  updateSurface(surface: NamedPalette, event: MouseEvent): void {
    this.settingsService.updatePreference('surface', surface.name as any);
    if (surface.palette) updateSurfacePalette(surface.palette as any);
    this.draft.update(d => ({ ...d, surface: surface.name }));
    event.stopPropagation();
  }

  toggleDark(value: boolean): void {
    this.layoutService.layoutConfig.update(c => ({ ...c, darkTheme: value }));
    this.draft.update(d => ({ ...d, darkMode: value }));
  }

  // ── Custom palette ────────────────────────────────────────────────────────

  onHexInputChange(value: string): void {
    this.customHexInput.set(value);
    if (isValidHex(value)) {
      this.customHex.set(value);
      this.customPalette.set(generatePaletteFromHex(value));
    }
  }

  generateCustomPalette(): void {
    const hex = this.customHex();
    if (!isValidHex(hex)) return;
    this.customPalette.set(generatePaletteFromHex(hex));
  }

  applyCustomPalette(): void {
    const palette = this.customPalette();
    if (!palette) return;
    const target = this.paletteTarget();

    if (target === 'primary') {
      const ext = this._buildCustomPrimaryExt(palette, this.selectedPreset());
      updatePreset(ext);
      this.draft.update(d => ({ ...d, primaryColor: 'custom', customPrimaryPalette: palette }));
      this.settingsService.updatePreference('primaryColor', 'custom' as any);
    } else {
      updateSurfacePalette(palette as any);
      this.draft.update(d => ({ ...d, surface: 'custom', customSurfacePalette: palette }));
      this.settingsService.updatePreference('surface', 'custom' as any);
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Palette Applied',
      detail: `Custom ${target} palette applied.`
    });
  }

  updateShadeColor(shade: ColorShade, hex: string): void {
    if (!isValidHex(hex)) return;
    this.customPalette.update(p => p ? { ...p, [shade]: hex } : p);
  }

  // ── Shape / Density / Shadow / Font ──────────────────────────────────────

  applyBorderRadius(preset: BorderRadiusPreset): void {
    this.draft.update(d => ({ ...d, borderRadius: preset }));
    this.themeBuilderSvc.applyCssVars({ borderRadius: preset });
  }

  applyDensity(density: DensityPreset): void {
    this.draft.update(d => ({ ...d, density }));
    this.themeBuilderSvc.applyCssVars({ density });
    this.settingsService.updatePreference('layoutDensity', density as any);
  }

  applyShadow(shadow: ShadowPreset): void {
    this.draft.update(d => ({ ...d, shadow }));
    this.themeBuilderSvc.applyCssVars({ shadow });
  }

  applyFont(font: FontPreset): void {
    this.draft.update(d => ({ ...d, font }));
    this.themeBuilderSvc.applyCssVars({ font });
  }

  // ── Typography ────────────────────────────────────────────────────────────

  updateTypography(patch: Partial<TypographySettings>): void {
    this.typography.update(t => ({ ...t, ...patch }));
    this.themeBuilderSvc.applyTypographyCssVars(this.typography());
    this.draft.update(d => ({ ...d, typography: this.typography() }));
  }

  updateTypographyBody(patch: Partial<TypographyBodySettings>): void {
    this.typography.update(t => ({ ...t, body: { ...t.body, ...patch } }));
    this.themeBuilderSvc.applyTypographyCssVars(this.typography());
    this.draft.update(d => ({ ...d, typography: this.typography() }));
  }

  scaleLabel(r: TypeScaleRatio | 'inherit'): string {
    if (r === 'inherit') return 'Inherit';
    return `${r} – ${SCALE_RATIO_MAP[r as TypeScaleRatio]}`;
  }

  // ── Save / Load ───────────────────────────────────────────────────────────

  openSaveDialog(): void {
    this.newThemeName.set('My Theme');
    this.showSaveDialog.set(true);
  }

  confirmSave(): void {
    const name = this.newThemeName().trim();
    if (!name) return;
    const theme: CustomTheme = {
      ...this.draft(),
      key:       this.themeBuilderSvc.generateKey(),
      label:     name,
      createdAt: Date.now(),
    };
    this.themeBuilderSvc.save(theme);
    this.themeBuilderSvc.setActive(theme.key);
    this.showSaveDialog.set(false);
    this.messageService.add({ severity: 'success', summary: 'Theme Saved', detail: `"${name}" saved.` });
  }

  loadTheme(theme: CustomTheme): void {
    // Apply PrimeNG preset + colors
    const preset = PRESETS[theme.preset];
    const surfPalette = theme.customSurfacePalette
      ? theme.customSurfacePalette
      : SURFACES.find(s => s.name === theme.surface)?.palette;

    const ext = theme.customPrimaryPalette
      ? this._buildCustomPrimaryExt(theme.customPrimaryPalette as ColorPalette, theme.preset)
      : this._getPresetExt(theme.primaryColor, theme.preset);

    $t().preset(preset).preset(ext).surfacePalette(surfPalette as any).use({ useDefaultOptions: true });

    // Dark mode
    this.layoutService.layoutConfig.update(c => ({
      ...c,
      preset:    theme.preset,
      primary:   theme.primaryColor,
      surface:   theme.surface,
      darkTheme: theme.darkMode,
    }));

    // CSS vars
    this.themeBuilderSvc.applyCssVars(theme);
    this.themeBuilderSvc.setActive(theme.key);

    // Update draft
    this.draft.set({
      preset:      theme.preset,
      primaryColor: theme.primaryColor,
      surface:     theme.surface,
      darkMode:    theme.darkMode,
      borderRadius: theme.borderRadius,
      density:     theme.density,
      shadow:      theme.shadow,
      font:        theme.font,
      typography:  theme.typography,
      customPrimaryPalette: theme.customPrimaryPalette,
      customSurfacePalette: theme.customSurfacePalette,
    });

    if (theme.typography) {
      this.typography.set({ ...theme.typography, body: { ...theme.typography.body } });
    }

    this.messageService.add({ severity: 'success', summary: 'Theme Loaded', detail: `"${theme.label}" applied.` });
  }

  deleteTheme(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.themeBuilderSvc.delete(key);
  }

  exportTheme(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.themeBuilderSvc.exportTheme(key);
  }

  exportAll(): void {
    this.themeBuilderSvc.exportAll();
  }

  openImportDialog(): void {
    this.importJson.set('');
    this.showImportDialog.set(true);
  }

  confirmImport(): void {
    const result = this.themeBuilderSvc.importThemes(this.importJson());
    this.showImportDialog.set(false);
    this.messageService.add({
      severity: result.imported > 0 ? 'success' : 'warn',
      summary: 'Import Complete',
      detail: `${result.imported} imported, ${result.skipped} skipped.`
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  swatchBg(color: NamedPalette): string {
    return color.name === 'noir' ? 'var(--text-color)' : (color.palette?.['500'] ?? '#999');
  }

  trackByName(_: number, item: { name: string }): string { return item.name; }
  trackByKey(_: number, item: CustomTheme): string { return item.key; }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  densityLabel(d: DensityPreset): string {
    return { compact: 'Compact', comfortable: 'Comfortable', spacious: 'Spacious' }[d];
  }
  shadowLabel(s: ShadowPreset): string {
    return { none: 'None', subtle: 'Subtle', medium: 'Medium', dramatic: 'Dramatic' }[s];
  }
  radiusLabel(r: BorderRadiusPreset): string {
    return { sharp: 'Sharp', rounded: 'Rounded', soft: 'Soft', pill: 'Pill' }[r];
  }
  fontLabel(f: FontPreset): string { return FONT_MAP[f].label; }

  // ── PrimeNG preset extension builder (copied from app.configurator) ───────

  private _getPresetExt(primaryName: string, preset: PresetKey): any {
    const colors = this.primaryColors();
    const color  = colors.find(c => c.name === primaryName);
    if (!color) return {};
    if (primaryName === 'noir') return this._noirExt();
    return preset === 'Nora' ? this._noraExt(color.palette) : this._defaultExt(color.palette);
  }

  private _buildCustomPrimaryExt(palette: Partial<ColorPalette>, preset: PresetKey): any {
    return preset === 'Nora' ? this._noraExt(palette) : this._defaultExt(palette);
  }

  private _noirExt(): any {
    return { semantic: { primary: { '50':'{surface.50}','100':'{surface.100}','200':'{surface.200}','300':'{surface.300}','400':'{surface.400}','500':'{surface.500}','600':'{surface.600}','700':'{surface.700}','800':'{surface.800}','900':'{surface.900}','950':'{surface.950}' }, colorScheme: { light: { primary: { color:'{primary.950}', contrastColor:'#ffffff', hoverColor:'{primary.800}', activeColor:'{primary.700}' }, highlight: { background:'{primary.950}', focusBackground:'{primary.700}', color:'#ffffff', focusColor:'#ffffff' } }, dark: { primary: { color:'{primary.50}', contrastColor:'{primary.950}', hoverColor:'{primary.200}', activeColor:'{primary.300}' }, highlight: { background:'{primary.50}', focusBackground:'{primary.300}', color:'{primary.950}', focusColor:'{primary.950}' } } } } };
  }

  private _noraExt(palette: any): any {
    return { semantic: { primary: palette, colorScheme: { light: { primary: { color:'{primary.600}', contrastColor:'#ffffff', hoverColor:'{primary.700}', activeColor:'{primary.800}' }, highlight: { background:'{primary.600}', focusBackground:'{primary.700}', color:'#ffffff', focusColor:'#ffffff' } }, dark: { primary: { color:'{primary.500}', contrastColor:'{surface.900}', hoverColor:'{primary.400}', activeColor:'{primary.300}' }, highlight: { background:'{primary.500}', focusBackground:'{primary.400}', color:'{surface.900}', focusColor:'{surface.900}' } } } } };
  }

  private _defaultExt(palette: any): any {
    return { semantic: { primary: palette, colorScheme: { light: { primary: { color:'{primary.500}', contrastColor:'#ffffff', hoverColor:'{primary.600}', activeColor:'{primary.700}' }, highlight: { background:'{primary.50}', focusBackground:'{primary.100}', color:'{primary.700}', focusColor:'{primary.800}' } }, dark: { primary: { color:'{primary.400}', contrastColor:'{surface.900}', hoverColor:'{primary.300}', activeColor:'{primary.200}' }, highlight: { background:'color-mix(in srgb, {primary.400}, transparent 84%)', focusBackground:'color-mix(in srgb, {primary.400}, transparent 76%)', color:'rgba(255,255,255,.87)', focusColor:'rgba(255,255,255,.87)' } } } } };
  }
}