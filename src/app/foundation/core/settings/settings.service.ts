import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';

import {
  DEFAULT_PREFERENCES,
  LayoutDensity,
  MenuMode,
  ThemePreset,
  UserPreferences,
  UserPreferencesApiResponse,
  UserPreferencesPayload,
  UserPreferencesDto,
  FontSize,
  SupportedLang
} from './settings.model';

const FONT_SIZE_MAP: Record<UserPreferences['fontSize'], string> = {
  sm: '13px',
  md: '15px',
  lg: '17px'
};

const DENSITY_MAP: Record<UserPreferences['layoutDensity'], string> = {
  compact: '0.5rem',
  comfortable: '1rem',
  spacious: '1.5rem'
};

// ─── PrimeNG Theme Presets ────────────────────────────────────────────────────
const PRESETS = { Aura, Lara, Nora } as const;
type PresetKey = keyof typeof PRESETS;

type SurfacePalette = Record<string, string>;

const SURFACE_PALETTES: Record<string, SurfacePalette> = {
  slate:   { 0:'#ffffff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  gray:    { 0:'#ffffff',50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
  zinc:    { 0:'#ffffff',50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b' },
  neutral: { 0:'#ffffff',50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a' },
  stone:   { 0:'#ffffff',50:'#fafaf9',100:'#f5f5f4',200:'#e7e5e4',300:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',700:'#44403c',800:'#292524',900:'#1c1917',950:'#0c0a09' },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly layoutService = inject(LayoutService);
  private readonly transloco = inject(TranslocoService);

  private readonly STORAGE_KEY = 'user_preferences';
  private readonly LEGACY_STORAGE_KEY = 'app_config';
  private readonly FAKE_USER_ID = 1;

  /**
   * Single source of truth for resolved app preferences.
   * Public updates should go through methods (save/update/reset).
   */
  private readonly _preferences$ = new BehaviorSubject<UserPreferences>(
    this._loadFromLocal() ?? { ...DEFAULT_PREFERENCES }
  );

  /** Observable view for future backend integration / feature wiring. */
  readonly preferences$ = this._preferences$.asObservable();

  constructor() {
    const stored = this._preferences$.value;

    // If LayoutService has already restored values from `app_config`,
    // prefer them at startup so UI bootstrap matches persisted state.
    const layoutDarkMode = this.layoutService.layoutConfig().darkTheme;
    const layoutLanguage = this.layoutService.layoutConfig().lang;
    const initial: UserPreferences =
      layoutDarkMode === stored.darkMode && layoutLanguage === stored.language
        ? stored
        : {
            ...stored,
            darkMode: layoutDarkMode,
            language: layoutLanguage
          };

    // Ensure DOM/i18n state is correct before UI renders (best-effort).
    this._applyLanguageToDom(initial.language);
    this._applyDarkModeToDom(initial.darkMode);

    // Rehydrate state + align persisted preferences when we merged from LayoutService.
    if (
      initial.darkMode !== stored.darkMode ||
      initial.language !== stored.language
    ) {
      this._preferences$.next(initial);
      this._saveToLocal(initial);
    }

    this._syncToLayoutService(initial);
    this._applyExtras(initial);

    // Keep user_preferences in sync with LayoutService (e.g. when dark mode is toggled
    // directly from `AppTopbar`, which updates LayoutService rather than SettingsService).
    effect(() => {
      const darkModeFromLayout = this.layoutService.layoutConfig().darkTheme;
      const currentDarkMode = this._preferences$.value.darkMode;
      if (darkModeFromLayout === currentDarkMode) return;

      // Persist + apply DOM + keep LayoutService aligned.
      this._setPreferences({
        ...this._preferences$.value,
        darkMode: darkModeFromLayout
      });
    });

    effect(() => {
      const languageFromLayout = this.layoutService.layoutConfig().lang;
      const currentLanguage = this._preferences$.value.language;
      if (languageFromLayout === currentLanguage) return;

      this._setPreferences({
        ...this._preferences$.value,
        language: languageFromLayout
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════

  getUserPreferences(): UserPreferences {
    return this._preferences$.value;
  }

  isDarkMode(): boolean {
    return this._preferences$.value.darkMode;
  }

  currentLang(): SupportedLang {
    return this._preferences$.value.language;
  }

  /** DTO-friendly setter for future backend integration. */
  setPreferencesFromDto(dto: UserPreferencesDto): void {
    this._setPreferences(this._fromDto(dto));
  }

  /** DTO-friendly getter for future backend integration. */
  getPreferencesDto(): UserPreferencesDto {
    return this._toDto(this._preferences$.value);
  }

  saveUserPreferences(prefs: UserPreferences): void {
    this._setPreferences(prefs);
  }

  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    const next: UserPreferences = { ...this._preferences$.value, [key]: value };
    this._setPreferences(next);
  }

  resetPreferences(): void {
    this._setPreferences({ ...DEFAULT_PREFERENCES });
  }

  /**
   * Applies a PrimeNG theme preset to the DOM immediately.
   * Call this whenever the theme preset changes (e.g. Aura → Lara).
   * Preserves current primary color and surface palette.
   */
  applyThemePreset(preset: ThemePreset): void {
    const primePreset = PRESETS[preset as PresetKey];
    if (!primePreset) return;
    const prefs = this._preferences$.value;
    const surfacePalette = SURFACE_PALETTES[prefs.surface] ?? undefined;
    $t()
      .preset(primePreset)
      .preset(this._buildPresetExt(prefs.primaryColor, preset))
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
  }

  /**
   * Applies a primary color change to the DOM immediately.
   * Call this whenever the primary color changes.
   */
  applyPrimaryColor(colorName: string): void {
    const prefs = this._preferences$.value;
    updatePreset(this._buildPresetExt(colorName, prefs.theme));
  }

  /**
   * Applies a surface palette change to the DOM immediately.
   */
  applySurface(surfaceName: string): void {
    const palette = SURFACE_PALETTES[surfaceName];
    if (palette) updateSurfacePalette(palette);
  }

  /**
   * DTO-ready payload intended for future backend POST/PUT.
   * (No actual HTTP is implemented here; see fake API layer below.)
   */
  buildApiPayload(userId = this.FAKE_USER_ID): UserPreferencesPayload {
    return {
      userId,
      preferences: this._toDto(this._preferences$.value),
      updatedAt: new Date().toISOString()
    };
  }

  // ── Fake API layer ────────────────────────────────────────────────────────

  fetchPreferencesFromApi(
    userId = this.FAKE_USER_ID
  ): Observable<UserPreferencesApiResponse> {
    const res: UserPreferencesApiResponse = {
      success: true,
      data: this.buildApiPayload(userId),
      message: 'Fetched (simulated)'
    };
    console.log('[SettingsService] Fake GET', res);
    return of(res).pipe(delay(300));
  }

  postPreferencesToApi(
    userId = this.FAKE_USER_ID
  ): Observable<UserPreferencesApiResponse> {
    const res: UserPreferencesApiResponse = {
      success: true,
      data: this.buildApiPayload(userId),
      message: 'Created (simulated)'
    };
    console.log('[SettingsService] Fake POST', res);
    return of(res).pipe(
      delay(400),
      tap((r) => console.log('[SettingsService] POST ok', r))
    );
  }

  putPreferencesToApi(
    userId = this.FAKE_USER_ID
  ): Observable<UserPreferencesApiResponse> {
    const res: UserPreferencesApiResponse = {
      success: true,
      data: this.buildApiPayload(userId),
      message: 'Updated (simulated)'
    };
    console.log('[SettingsService] Fake PUT', res);
    return of(res).pipe(
      delay(350),
      tap((r) => console.log('[SettingsService] PUT ok', r))
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIVATE
  // ══════════════════════════════════════════════════════════════════════════

  private _setPreferences(next: UserPreferences): void {
    const resolved = this._resolveToUserPreferences(next);
    this._preferences$.next(resolved);
    this._saveToLocal(resolved);
    this._applyLanguageToDom(resolved.language);
    this._applyDarkModeToDom(resolved.darkMode);
    this._syncToLayoutService(resolved);
    this._applyExtras(resolved);
  }

  private _syncToLayoutService(prefs: UserPreferences): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      preset: prefs.theme,
      primary: prefs.primaryColor,
      surface: prefs.surface,
      darkTheme: prefs.darkMode,
      menuMode: prefs.menuMode,
      lang: prefs.language
    }));
  }

  /** Apply CSS vars that LayoutService doesn't handle (font-size, density). */
  private _applyExtras(prefs: UserPreferences): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const html = document.documentElement;
    html.style.setProperty(
      '--app-font-size',
      FONT_SIZE_MAP[prefs.fontSize] ?? '15px'
    );
    html.style.setProperty(
      '--app-layout-density',
      DENSITY_MAP[prefs.layoutDensity] ?? '1rem'
    );
    html.style.setProperty('--app-primary-color-name', prefs.primaryColor);
  }

  private _applyDarkModeToDom(darkMode: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.classList.toggle('p-dark', darkMode);
    document.documentElement.classList.toggle('app-dark', darkMode);
  }

  private _applyLanguageToDom(language: SupportedLang): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.transloco.setActiveLang(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }

  private _loadFromLocal(): UserPreferences | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      const parsed = this._safeJsonParse(raw);
      if (parsed !== null) return this._resolveFromStorage(parsed);
    }

    const legacyRaw = localStorage.getItem(this.LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = this._safeJsonParse(legacyRaw);
      if (parsed !== null) return this._resolveFromLegacyStorage(parsed);
    }

    return null;
  }

  private _saveToLocal(prefs: UserPreferences): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }

  private _safeJsonParse(raw: string): unknown | null {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  private _resolveFromStorage(value: unknown): UserPreferences {
    // Stored preferences are expected to be flat (UserPreferences),
    // but we accept nested DTO shape for forward compatibility.
    const obj =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};

    const layoutCandidate = obj['layout'];
    const layout =
      layoutCandidate && typeof layoutCandidate === 'object'
        ? (layoutCandidate as Record<string, unknown>)
        : undefined;

    const language =
      this._readSupportedLang(obj['language']) ?? DEFAULT_PREFERENCES.language;
    const theme =
      this._readThemePreset(obj['theme']) ?? DEFAULT_PREFERENCES.theme;
    const primaryColor =
      this._readNonEmptyString(obj['primaryColor']) ??
      DEFAULT_PREFERENCES.primaryColor;
    const surface =
      this._readNonEmptyString(obj['surface']) ?? DEFAULT_PREFERENCES.surface;
    const darkMode =
      typeof obj['darkMode'] === 'boolean'
        ? obj['darkMode']
        : DEFAULT_PREFERENCES.darkMode;

    const fontSize =
      this._readFontSize(obj['fontSize']) ?? DEFAULT_PREFERENCES.fontSize;

    const menuMode =
      (layout ? this._readMenuMode(layout['menuMode']) : undefined) ??
      this._readMenuMode(obj['menuMode']) ??
      DEFAULT_PREFERENCES.menuMode;
    const layoutDensity =
      (layout ? this._readLayoutDensity(layout['layoutDensity']) : undefined) ??
      this._readLayoutDensity(obj['layoutDensity']) ??
      DEFAULT_PREFERENCES.layoutDensity;

    return {
      ...DEFAULT_PREFERENCES,
      language,
      theme,
      primaryColor,
      surface,
      darkMode,
      fontSize,
      menuMode,
      layoutDensity
    };
  }

  private _resolveFromLegacyStorage(value: unknown): UserPreferences | null {
    const obj =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : null;
    if (!obj) return null;

    const theme: ThemePreset =
      this._readThemePreset(obj['preset']) ?? DEFAULT_PREFERENCES.theme;

    const primaryColor =
      this._readNonEmptyString(obj['primary']) ??
      DEFAULT_PREFERENCES.primaryColor;
    const surface =
      this._readNonEmptyString(obj['surface']) ?? DEFAULT_PREFERENCES.surface;
    const darkMode =
      typeof obj['darkTheme'] === 'boolean'
        ? obj['darkTheme']
        : DEFAULT_PREFERENCES.darkMode;

    const menuMode: MenuMode =
      this._readMenuMode(obj['menuMode']) ?? DEFAULT_PREFERENCES.menuMode;
    const language: SupportedLang =
      this._readSupportedLang(obj['lang']) ?? DEFAULT_PREFERENCES.language;

    return {
      ...DEFAULT_PREFERENCES,
      theme,
      primaryColor,
      surface,
      darkMode,
      menuMode,
      language
    };
  }

  private _resolveToUserPreferences(input: UserPreferences): UserPreferences {
    // In principle the caller already provides a valid type, but this protects
    // against runtime mismatches (e.g. when values come from loosely typed sources).
    const language =
      this._readSupportedLang(input.language) ?? DEFAULT_PREFERENCES.language;
    const theme =
      this._readThemePreset(input.theme) ?? DEFAULT_PREFERENCES.theme;
    const primaryColor =
      this._readNonEmptyString(input.primaryColor) ??
      DEFAULT_PREFERENCES.primaryColor;
    const surface =
      this._readNonEmptyString(input.surface) ?? DEFAULT_PREFERENCES.surface;

    const fontSize =
      this._readFontSize(input.fontSize) ?? DEFAULT_PREFERENCES.fontSize;
    const menuMode =
      this._readMenuMode(input.menuMode) ?? DEFAULT_PREFERENCES.menuMode;
    const layoutDensity =
      this._readLayoutDensity(input.layoutDensity) ??
      DEFAULT_PREFERENCES.layoutDensity;

    return {
      language,
      theme,
      primaryColor,
      surface,
      darkMode: input.darkMode,
      fontSize,
      menuMode,
      layoutDensity
    };
  }

  private _toDto(prefs: UserPreferences): UserPreferencesDto {
    return {
      language: prefs.language,
      theme: prefs.theme,
      primaryColor: prefs.primaryColor,
      darkMode: prefs.darkMode,
      // Optional fields are safe to include; backend can ignore omitted ones.
      fontSize: prefs.fontSize,
      layout: {
        menuMode: prefs.menuMode,
        layoutDensity: prefs.layoutDensity
      },
      surface: prefs.surface
    };
  }

  private _fromDto(dto: UserPreferencesDto): UserPreferences {
    const language =
      this._readSupportedLang(dto.language) ?? DEFAULT_PREFERENCES.language;
    const theme = this._readThemePreset(dto.theme) ?? DEFAULT_PREFERENCES.theme;
    const primaryColor =
      this._readNonEmptyString(dto.primaryColor) ??
      DEFAULT_PREFERENCES.primaryColor;
    const surface =
      this._readNonEmptyString(dto.surface) ?? DEFAULT_PREFERENCES.surface;

    const fontSize =
      this._readFontSize(dto.fontSize) ?? DEFAULT_PREFERENCES.fontSize;
    const menuMode =
      this._readMenuMode(dto.layout?.menuMode) ?? DEFAULT_PREFERENCES.menuMode;
    const layoutDensity =
      this._readLayoutDensity(dto.layout?.layoutDensity) ??
      DEFAULT_PREFERENCES.layoutDensity;

    return {
      language,
      theme,
      primaryColor,
      surface,
      darkMode: dto.darkMode,
      fontSize,
      menuMode,
      layoutDensity
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  Runtime readers (type-safe, no `any`)
  // ════════════════════════════════════════════════════════════════════════════════════

  private _readSupportedLang(v: unknown): SupportedLang | undefined {
    return v === 'en' || v === 'ar' ? v : undefined;
  }

  private _readThemePreset(v: unknown): ThemePreset | undefined {
    return v === 'Aura' || v === 'Lara' || v === 'Nora' ? v : undefined;
  }

  private _readFontSize(v: unknown): FontSize | undefined {
    return v === 'sm' || v === 'md' || v === 'lg' ? v : undefined;
  }

  private _readLayoutDensity(v: unknown): LayoutDensity | undefined {
    return v === 'compact' || v === 'comfortable' || v === 'spacious'
      ? v
      : undefined;
  }

  private _readMenuMode(v: unknown): MenuMode | undefined {
    return v === 'static' || v === 'overlay' ? v : undefined;
  }

  private _readNonEmptyString(v: unknown): string | undefined {
    return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
  }

  /**
   * Builds the PrimeNG preset extension object for a given primary color + preset.
   * Mirrors the logic in AppConfigurator.getPresetExt().
   */
  private _buildPresetExt(colorName: string, preset: ThemePreset): any {
    const primePreset = PRESETS[preset as PresetKey];
    const primitive = primePreset?.primitive as Record<string, unknown> | undefined;

    if (colorName === 'noir') {
      return {
        semantic: {
          primary: { 50:'{surface.50}',100:'{surface.100}',200:'{surface.200}',300:'{surface.300}',400:'{surface.400}',500:'{surface.500}',600:'{surface.600}',700:'{surface.700}',800:'{surface.800}',900:'{surface.900}',950:'{surface.950}' },
          colorScheme: {
            light:  { primary: { color:'{primary.950}',contrastColor:'#ffffff',hoverColor:'{primary.800}',activeColor:'{primary.700}' }, highlight: { background:'{primary.950}',focusBackground:'{primary.700}',color:'#ffffff',focusColor:'#ffffff' } },
            dark:   { primary: { color:'{primary.50}',contrastColor:'{primary.950}',hoverColor:'{primary.200}',activeColor:'{primary.300}' }, highlight: { background:'{primary.50}',focusBackground:'{primary.300}',color:'{primary.950}',focusColor:'{primary.950}' } }
          }
        }
      };
    }

    const palette = primitive ? primitive[colorName] : undefined;

    if (preset === 'Nora') {
      return {
        semantic: {
          primary: palette,
          colorScheme: {
            light:  { primary: { color:'{primary.600}',contrastColor:'#ffffff',hoverColor:'{primary.700}',activeColor:'{primary.800}' }, highlight: { background:'{primary.600}',focusBackground:'{primary.700}',color:'#ffffff',focusColor:'#ffffff' } },
            dark:   { primary: { color:'{primary.500}',contrastColor:'{surface.900}',hoverColor:'{primary.400}',activeColor:'{primary.300}' }, highlight: { background:'{primary.500}',focusBackground:'{primary.400}',color:'{surface.900}',focusColor:'{surface.900}' } }
          }
        }
      };
    }

    return {
      semantic: {
        primary: palette,
        colorScheme: {
          light:  { primary: { color:'{primary.500}',contrastColor:'#ffffff',hoverColor:'{primary.600}',activeColor:'{primary.700}' }, highlight: { background:'{primary.50}',focusBackground:'{primary.100}',color:'{primary.700}',focusColor:'{primary.800}' } },
          dark:   { primary: { color:'{primary.400}',contrastColor:'{surface.900}',hoverColor:'{primary.300}',activeColor:'{primary.200}' }, highlight: { background:'color-mix(in srgb, {primary.400}, transparent 84%)',focusBackground:'color-mix(in srgb, {primary.400}, transparent 76%)',color:'rgba(255,255,255,.87)',focusColor:'rgba(255,255,255,.87)' } }
        }
      }
    };
  }
}
