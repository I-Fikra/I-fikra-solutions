import { FontSize, LayoutDensity, MenuMode, SupportedLang, ThemePreset } from './user-preferences.types';

export interface LayoutPreferencesDto {
  menuMode?: MenuMode;
  layoutDensity?: LayoutDensity;
}

/**
 * DTO-ready preferences (DTOs are allowed to omit optional fields).
 * This is intended for backend integration and partial updates.
 */
export interface UserPreferencesDto {
  language: SupportedLang;
  theme: ThemePreset;
  primaryColor: string;
  darkMode: boolean;

  fontSize?: FontSize;
  layout?: LayoutPreferencesDto;

  // Optional for future API compatibility.
  surface?: string;
}

