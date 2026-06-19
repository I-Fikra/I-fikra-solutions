import {
  FontSize,
  LayoutDensity,
  MenuMode,
  SupportedLang,
  ThemePreset,
} from './user-preferences.types';

export interface UserPreferences {
  // Identity
  language: SupportedLang;

  // Appearance
  theme: ThemePreset;
  primaryColor: string; // e.g. 'emerald'
  surface: string; // e.g. 'slate'
  darkMode: boolean;

  // Typography
  fontSize: FontSize;

  // Layout
  menuMode: MenuMode;
  layoutDensity: LayoutDensity;
}

/** Default values applied on first run or after reset */
export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'ar',
  theme: 'Aura',
  primaryColor: 'sky',
  surface: 'slate',
  darkMode: false,
  fontSize: 'md',
  menuMode: 'static',
  layoutDensity: 'comfortable',
};

