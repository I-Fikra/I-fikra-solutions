import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PersonalityTokens {
  key: string;
  label: string;
  description: string;
  tags: string[];
  primePreset: 'Aura' | 'Lara' | 'Nora';
  primePrimary: string;
  primeSurface: string;
  primeDark: boolean;
  radiusBase: string;
  radiusCard: string;
  radiusDialog: string;
  radiusTable: string;
  fontFamily: string;       // primary (Latin) — kept for preset compatibility
  arabicFontFamily?: string;
  fontEntries?: FontEntry[]; // per-language overrides from custom builder
  fontSizeBase: string;
  headingWeight: string;
  bodyWeight?: string;
  bodyLineHeight: string;
  letterSpacing: string;
  bodyColor?: string;
  bodyBackground?: string;
  spacingUnit: string;
  tableRowHeight: string;
  cardPadding: string;
  cardShadow: string;
  cardBorder: string;
  dialogShadow: string;
  dialogBorder: string;
  dialogHeaderBg: string;
  dialogHeaderColor: string;
  tableHeaderBg: string;
  tableStriped: boolean;
  tableHoverBg: string;
  topbarBg: string;
  topbarColor: string;
  sidebarBg: string;
  sidebarActiveColor: string;
  buttonRadius: string;
  buttonPadding: string;
  buttonTextTransform: string;
  buttonFontWeight: string;
}

export const PERSONALITIES: PersonalityTokens[] = [
  {
    key: 'clean-pro',
    label: 'Clean Pro',
    description: 'مينيماليست احترافي — بيستخدمه المشاريع المؤسسية',
    tags: ['minimal', 'professional', 'light'],
    primePreset: 'Aura', primePrimary: 'sky', primeSurface: 'slate', primeDark: false,
    radiusBase: '6px', radiusCard: '8px', radiusDialog: '12px', radiusTable: '8px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '600',
    bodyLineHeight: '1.5', letterSpacing: '0', spacingUnit: '1', tableRowHeight: '3rem', cardPadding: '1.5rem',
    cardShadow: '0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)', cardBorder: '1px solid var(--surface-border)',
    dialogShadow: '0 20px 60px rgba(0,0,0,0.12)', dialogBorder: 'none',
    dialogHeaderBg: 'var(--surface-card)', dialogHeaderColor: 'var(--text-color)',
    tableHeaderBg: 'var(--surface-ground)', tableStriped: false, tableHoverBg: 'var(--surface-hover)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '6px', buttonPadding: '0.5rem 1.25rem', buttonTextTransform: 'none', buttonFontWeight: '500',
  },
  {
    key: 'bold-maritime',
    label: 'Bold Maritime',
    description: 'قوي وبحري — مناسب للمشاريع اللوجستية والبحرية',
    tags: ['bold', 'maritime', 'dark-accent'],
    primePreset: 'Nora', primePrimary: 'cyan', primeSurface: 'slate', primeDark: false,
    radiusBase: '4px', radiusCard: '6px', radiusDialog: '8px', radiusTable: '4px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '700',
    bodyLineHeight: '1.6', letterSpacing: '0.01em', spacingUnit: '1', tableRowHeight: '3.25rem', cardPadding: '1.5rem',
    cardShadow: '0 2px 8px rgba(0,0,0,0.12)', cardBorder: '1px solid var(--surface-border)',
    dialogShadow: '0 24px 64px rgba(0,0,0,0.18)', dialogBorder: '2px solid var(--primary-color)',
    dialogHeaderBg: 'var(--primary-color)', dialogHeaderColor: '#ffffff',
    tableHeaderBg: 'var(--primary-color)', tableStriped: true,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
    topbarBg: 'var(--primary-color)', topbarColor: '#ffffff',
    sidebarBg: 'var(--surface-900, #0f172a)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '4px', buttonPadding: '0.5rem 1.5rem', buttonTextTransform: 'uppercase', buttonFontWeight: '700',
  },
  {
    key: 'soft-modern',
    label: 'Soft Modern',
    description: 'ناعم وعصري — rounded corners وألوان هادية',
    tags: ['soft', 'rounded', 'friendly'],
    primePreset: 'Aura', primePrimary: 'violet', primeSurface: 'zinc', primeDark: false,
    radiusBase: '12px', radiusCard: '16px', radiusDialog: '20px', radiusTable: '12px',
    fontFamily: "'Nunito', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '700',
    bodyLineHeight: '1.6', letterSpacing: '0', spacingUnit: '1.1', tableRowHeight: '3.5rem', cardPadding: '1.75rem',
    cardShadow: '0 4px 20px rgba(0,0,0,0.08)', cardBorder: 'none',
    dialogShadow: '0 24px 80px rgba(0,0,0,0.14)', dialogBorder: 'none',
    dialogHeaderBg: 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #8b5cf6))',
    dialogHeaderColor: '#ffffff',
    tableHeaderBg: 'color-mix(in srgb, var(--primary-color) 8%, var(--surface-card))', tableStriped: false,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 6%, transparent)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '999px', buttonPadding: '0.5rem 1.5rem', buttonTextTransform: 'none', buttonFontWeight: '600',
  },
  {
    key: 'dark-elite',
    label: 'Dark Elite',
    description: 'داكن وراقي — مناسب للـ dashboards المتقدمة',
    tags: ['dark', 'elite', 'dashboard'],
    primePreset: 'Aura', primePrimary: 'amber', primeSurface: 'zinc', primeDark: true,
    radiusBase: '8px', radiusCard: '10px', radiusDialog: '14px', radiusTable: '8px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '600',
    bodyLineHeight: '1.5', letterSpacing: '0.01em', spacingUnit: '1', tableRowHeight: '3rem', cardPadding: '1.5rem',
    cardShadow: '0 4px 24px rgba(0,0,0,0.4)', cardBorder: '1px solid rgba(255,255,255,0.06)',
    dialogShadow: '0 32px 80px rgba(0,0,0,0.5)', dialogBorder: '1px solid rgba(255,255,255,0.08)',
    dialogHeaderBg: 'var(--surface-800, #27272a)', dialogHeaderColor: 'var(--text-color)',
    tableHeaderBg: 'var(--surface-800, #27272a)', tableStriped: false,
    tableHoverBg: 'rgba(255,255,255,0.04)',
    topbarBg: 'var(--surface-900, #18181b)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-950, #09090b)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '8px', buttonPadding: '0.5rem 1.25rem', buttonTextTransform: 'none', buttonFontWeight: '500',
  },
  {
    key: 'glass-popup',
    label: 'Glass Popup',
    description: 'بوب‑آب زجاجي مع gradient header — مستوحى من الـ app-popup-shell',
    tags: ['glass', 'popup', 'gradient'],
    primePreset: 'Aura', primePrimary: 'blue', primeSurface: 'slate', primeDark: false,
    radiusBase: '16px', radiusCard: '20px', radiusDialog: '36px', radiusTable: '12px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '600',
    bodyLineHeight: '1.55', letterSpacing: '0', spacingUnit: '1.1', tableRowHeight: '3.25rem', cardPadding: '1.5rem',
    cardShadow: '0 8px 32px rgba(0,0,0,0.12)', cardBorder: '1px solid rgba(255,255,255,0.22)',
    dialogShadow: '0 14px 34px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)', dialogBorder: 'none',
    dialogHeaderBg: 'linear-gradient(180deg, var(--primary-color) 0%, rgba(33,150,243,0) 100%)',
    dialogHeaderColor: '#ffffff',
    tableHeaderBg: 'var(--surface-ground)', tableStriped: false,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 6%, transparent)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '999px', buttonPadding: '0.5rem 1.5rem', buttonTextTransform: 'none', buttonFontWeight: '600',
  },
  {
    key: 'card-focus',
    label: 'Card Focus',
    description: 'كارد elevated مع shadow قوي وهيدر ملوّن — مثالي للـ dashboards',
    tags: ['elevated', 'card', 'colorful'],
    primePreset: 'Lara', primePrimary: 'indigo', primeSurface: 'slate', primeDark: false,
    radiusBase: '10px', radiusCard: '14px', radiusDialog: '16px', radiusTable: '10px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '700',
    bodyLineHeight: '1.55', letterSpacing: '0', spacingUnit: '1.05', tableRowHeight: '3.25rem', cardPadding: '1.75rem',
    cardShadow: '0 4px 20px rgba(0,0,0,0.09)', cardBorder: 'none',
    dialogShadow: '0 20px 60px rgba(0,0,0,0.14)', dialogBorder: 'none',
    dialogHeaderBg: 'var(--primary-color)', dialogHeaderColor: '#ffffff',
    tableHeaderBg: 'color-mix(in srgb, var(--primary-color) 8%, var(--surface-card))', tableStriped: false,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 6%, transparent)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '10px', buttonPadding: '0.5rem 1.25rem', buttonTextTransform: 'none', buttonFontWeight: '600',
  },
  {
    key: 'table-master',
    label: 'Table Master',
    description: 'تركيز كامل على الجداول — striped + bordered + header واضح',
    tags: ['table', 'striped', 'data-dense'],
    primePreset: 'Nora', primePrimary: 'teal', primeSurface: 'gray', primeDark: false,
    radiusBase: '4px', radiusCard: '8px', radiusDialog: '10px', radiusTable: '6px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '13px', headingWeight: '600',
    bodyLineHeight: '1.45', letterSpacing: '0.01em', spacingUnit: '0.95', tableRowHeight: '2.75rem', cardPadding: '1.25rem',
    cardShadow: 'none', cardBorder: '1px solid var(--surface-border)',
    dialogShadow: '0 16px 48px rgba(0,0,0,0.12)', dialogBorder: '1px solid var(--surface-border)',
    dialogHeaderBg: 'var(--surface-ground)', dialogHeaderColor: 'var(--text-color)',
    tableHeaderBg: 'var(--primary-color)', tableStriped: true,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '4px', buttonPadding: '0.45rem 1.25rem', buttonTextTransform: 'none', buttonFontWeight: '500',
  },
  {
    key: 'popup-accent',
    label: 'Popup Accent',
    description: 'popup menu مع outlined border والكارد flat — نظيف ومميز',
    tags: ['outlined', 'accent', 'popup'],
    primePreset: 'Aura', primePrimary: 'emerald', primeSurface: 'zinc', primeDark: false,
    radiusBase: '8px', radiusCard: '12px', radiusDialog: '20px', radiusTable: '8px',
    fontFamily: "'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '600',
    bodyLineHeight: '1.6', letterSpacing: '0', spacingUnit: '1', tableRowHeight: '3rem', cardPadding: '1.5rem',
    cardShadow: 'none', cardBorder: '1.5px solid var(--surface-border)',
    dialogShadow: '0 16px 56px rgba(0,0,0,0.14)', dialogBorder: '2px solid var(--primary-color)',
    dialogHeaderBg: 'var(--surface-card)', dialogHeaderColor: 'var(--text-color)',
    tableHeaderBg: 'var(--surface-ground)', tableStriped: false,
    tableHoverBg: 'color-mix(in srgb, var(--primary-color) 5%, transparent)',
    topbarBg: 'var(--surface-card)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-card)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '8px', buttonPadding: '0.5rem 1.25rem', buttonTextTransform: 'none', buttonFontWeight: '500',
  },
  {
    key: 'dark-popup',
    label: 'Dark Popup',
    description: 'dark mode مع popup shell داكنة وكارد glass — للـ ops dashboards',
    tags: ['dark', 'popup', 'glass'],
    primePreset: 'Aura', primePrimary: 'cyan', primeSurface: 'zinc', primeDark: true,
    radiusBase: '10px', radiusCard: '14px', radiusDialog: '36px', radiusTable: '8px',
    fontFamily: "'Lato', 'Cairo', sans-serif", fontSizeBase: '14px', headingWeight: '600',
    bodyLineHeight: '1.5', letterSpacing: '0.01em', spacingUnit: '1', tableRowHeight: '3rem', cardPadding: '1.5rem',
    cardShadow: '0 8px 32px rgba(0,0,0,0.35)', cardBorder: '1px solid rgba(255,255,255,0.08)',
    dialogShadow: '0 14px 34px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.2)', dialogBorder: 'none',
    dialogHeaderBg: 'linear-gradient(180deg, var(--primary-color) 0%, rgba(6,182,212,0) 100%)',
    dialogHeaderColor: '#ffffff',
    tableHeaderBg: 'var(--surface-800, #27272a)', tableStriped: false,
    tableHoverBg: 'rgba(255,255,255,0.05)',
    topbarBg: 'var(--surface-900, #18181b)', topbarColor: 'var(--text-color)',
    sidebarBg: 'var(--surface-950, #09090b)', sidebarActiveColor: 'var(--primary-color)',
    buttonRadius: '999px', buttonPadding: '0.5rem 1.5rem', buttonTextTransform: 'none', buttonFontWeight: '600',
  },
];

export type ComponentShape = 'sharp' | 'rounded' | 'soft' | 'pill';
export type TableStyle = 'default' | 'striped' | 'bordered' | 'minimal';
export type DialogStyle = 'flat' | 'accent-header' | 'gradient-header' | 'outlined';
export type CardStyle = 'elevated' | 'bordered' | 'flat' | 'glass';
export type TableRowSeparator = 'none' | 'thin' | 'thick' | 'colored';
export type TableHeaderStyle = 'filled' | 'gradient' | 'minimal';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShadow = 'none' | 'soft' | 'lifted';
export type ButtonIconPos = 'left' | 'right';
export type DialogHeaderHeight = 'compact' | 'normal' | 'tall';
export type DialogOverlay = 'light' | 'medium' | 'dark';
export type DialogAnimation = 'fade' | 'slide' | 'zoom';
export type TopbarHeight       = 'compact' | 'normal' | 'tall';
export type TopbarBorder       = 'none' | 'thin' | 'shadow';
export type TopbarLogoStyle    = 'icon-text' | 'icon-only' | 'text-only' | 'hidden';
export type TopbarNavAlign     = 'left' | 'center' | 'right';
export type TopbarNavStyle     = 'links' | 'pills' | 'underline' | 'buttons';

/** ناف لينك واحد في التوبار */
export interface TopbarNavItem {
  id:      string;   // unique key
  label:   string;   // النص اللي يظهر
  icon:    string;   // primeng icon class  e.g. "pi pi-home"
  route:   string;   // router path  e.g. "/dashboard"
  enabled: boolean;
}

export type SidebarWidth = 'narrow' | 'normal' | 'wide';
export type LoginLayout = 'centered' | 'split' | 'fullscreen';
export type LoginBg = 'solid' | 'gradient' | 'image';
export type LoginLogoPos = 'top' | 'left' | 'hidden';

export interface ColorZones {
  bodyBg: string;
  sidebarBg: string;
  topbarBg: string;
  cardBg: string;
  primaryAccent: string;
  textColor: string;
}

export const DEFAULT_COLOR_ZONES: ColorZones = {
  bodyBg: '', sidebarBg: '', topbarBg: '', cardBg: '', primaryAccent: '', textColor: '',
};

export interface ComponentDetails {
  tableRowSeparator: TableRowSeparator;
  tableColumnSeparator: boolean;
  tableHeaderStyle: TableHeaderStyle;
  tableHoverColor: string;
  buttonSize: ButtonSize;
  buttonShadow: ButtonShadow;
  buttonIconPos: ButtonIconPos;
  dialogHeaderHeight: DialogHeaderHeight;
  dialogOverlayOpacity: DialogOverlay;
  dialogAnimation: DialogAnimation;
  topbarHeight:       TopbarHeight;
  topbarBorderStyle:  TopbarBorder;
  topbarLogoStyle:    TopbarLogoStyle;
  topbarNavItems:     TopbarNavItem[];
  topbarNavAlign:     TopbarNavAlign;
  topbarNavStyle:     TopbarNavStyle;
  topbarShowLang:     boolean;
  topbarShowTheme:    boolean;
  topbarShowConfig:   boolean;
  topbarShowSearch:   boolean;
  topbarShowNotif:    boolean;
  sidebarWidth: SidebarWidth;
  sidebarIconsOnly: boolean;
  loginLayout: LoginLayout;
  loginBg: LoginBg;
  loginBgColor: string;
  loginBgGradientFrom: string;
  loginBgGradientTo: string;
  loginLogoPos: LoginLogoPos;
}

export const DEFAULT_COMPONENT_DETAILS: ComponentDetails = {
  tableRowSeparator: 'thin',
  tableColumnSeparator: false,
  tableHeaderStyle: 'filled',
  tableHoverColor: '',
  buttonSize: 'md',
  buttonShadow: 'none',
  buttonIconPos: 'left',
  dialogHeaderHeight: 'normal',
  dialogOverlayOpacity: 'medium',
  dialogAnimation: 'fade',
  topbarHeight: 'normal',
  topbarBorderStyle: 'shadow',
  topbarLogoStyle:  'icon-text',
  topbarNavItems:   [],
  topbarNavAlign:   'center',
  topbarNavStyle:   'links',
  topbarShowLang:   true,
  topbarShowTheme:  true,
  topbarShowConfig: true,
  topbarShowSearch: false,
  topbarShowNotif:  false,
  sidebarWidth: 'normal',
  sidebarIconsOnly: false,
  loginLayout: 'centered',
  loginBg: 'solid',
  loginBgColor: '#f8fafc',
  loginBgGradientFrom: '#667eea',
  loginBgGradientTo: '#764ba2',
  loginLogoPos: 'top',
};

// Maps a script/language name to the CSS variable it controls
export const LANG_CSS_VAR: Record<string, string> = {
  'English / Latin': '--app-font-latin',
  'Arabic':          '--app-font-arabic',
  'Chinese':         '--app-font-chinese',
  'Japanese':        '--app-font-japanese',
  'Korean':          '--app-font-korean',
  'Greek':           '--app-font-greek',
  'Cyrillic':        '--app-font-cyrillic',
  'Custom':          '--app-font-custom',
};

export interface FontEntry {
  lang: string;   // one of the keys in LANG_CSS_VAR (or any custom label)
  font: string;   // CSS font-family value
}

/** First entry is Primary (drives --app-font-family), rest are per-script overrides */
export const DEFAULT_FONT_ENTRIES: FontEntry[] = [
  { lang: 'English / Latin', font: "'Lato', sans-serif"  },
  { lang: 'Arabic',          font: "'Cairo', sans-serif" },
];

export interface CustomPersonality {
  shape: ComponentShape;
  tableStyle: TableStyle;
  dialogStyle: DialogStyle;
  cardStyle: CardStyle;
  topbarAccented: boolean;
  sidebarDark: boolean;
  buttonShape: ComponentShape;
  fontEntries: FontEntry[];    // index 0 = primary, 1 = secondary, etc.
  primePreset: 'Aura' | 'Lara' | 'Nora';
  primePrimary: string;
  primeSurface: string;
  primeDark: boolean;
  colorZones: ColorZones;
  componentDetails: ComponentDetails;
  // Typography fine-tune
  fontSizeBase: string;
  scaleRatio: string;
  bodyWeight: string;
  bodyLineHeight: string;
  bodyLetterSpacing: string;
  bodyColor: string;
  bodyBackground: string;
  // Responsive breakpoint
  responsiveMinWidth: string;
  responsiveFontSize: string;
  responsiveScale: string;
}

export const DEFAULT_CUSTOM: CustomPersonality = {
  shape: 'rounded', tableStyle: 'default', dialogStyle: 'flat', cardStyle: 'elevated',
  topbarAccented: false, sidebarDark: false, buttonShape: 'rounded',
  fontEntries: [...DEFAULT_FONT_ENTRIES],
  primePreset: 'Aura', primePrimary: 'sky', primeSurface: 'slate', primeDark: false,
  colorZones: { ...DEFAULT_COLOR_ZONES },
  componentDetails: { ...DEFAULT_COMPONENT_DETAILS },
  fontSizeBase: '16px',
  scaleRatio: '1.200',
  bodyWeight: '400',
  bodyLineHeight: '1.6',
  bodyLetterSpacing: '0em',
  bodyColor: '#222222',
  bodyBackground: '#ffffff',
  responsiveMinWidth: '',
  responsiveFontSize: '',
  responsiveScale: 'inherit',
};

const SHAPE_RADIUS:  Record<ComponentShape, string> = { sharp: '2px', rounded: '6px', soft: '14px', pill: '20px' };
const BTN_RADIUS:    Record<ComponentShape, string> = { sharp: '3px', rounded: '6px', soft: '12px', pill: '20px' };
const CARD_RADIUS:   Record<ComponentShape, string> = { sharp: '4px', rounded: '10px', soft: '18px', pill: '20px' };
const DIALOG_RADIUS: Record<ComponentShape, string> = { sharp: '4px', rounded: '12px', soft: '20px', pill: '24px' };

export function tokensFromCustom(c: CustomPersonality): Partial<PersonalityTokens> {
  const cardShadow: Record<CardStyle, string> = {
    elevated: '0 4px 20px rgba(0,0,0,0.09)', bordered: 'none', flat: 'none',
    glass: '0 8px 32px rgba(0,0,0,0.12)',
  };
  const cardBorder: Record<CardStyle, string> = {
    elevated: 'none', bordered: '1px solid var(--surface-border)',
    flat: '1px solid var(--surface-border)', glass: '1px solid rgba(255,255,255,0.18)',
  };
  const dialogHeaderBg: Record<DialogStyle, string> = {
    'flat': 'var(--surface-card)', 'accent-header': 'var(--primary-color)',
    'gradient-header': 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb,var(--primary-color) 60%,#8b5cf6))',
    'outlined': 'var(--surface-card)',
  };
  const dialogHeaderColor: Record<DialogStyle, string> = {
    'flat': 'var(--text-color)', 'accent-header': '#ffffff',
    'gradient-header': '#ffffff', 'outlined': 'var(--text-color)',
  };
  const dialogBorder: Record<DialogStyle, string> = {
    'flat': 'none', 'accent-header': 'none',
    'gradient-header': 'none', 'outlined': '2px solid var(--primary-color)',
  };

  const cd = c.componentDetails;
  const btnSizeMap: Record<ButtonSize, string> = { sm: '0.35rem 0.85rem', md: '0.5rem 1.25rem', lg: '0.7rem 1.75rem' };
  const zones = c.colorZones;
  const topbarBg = zones.topbarBg || (c.topbarAccented ? 'var(--primary-color)' : 'var(--surface-card)');
  const topbarColor = c.topbarAccented && !zones.topbarBg ? '#ffffff' : 'var(--text-color)';
  const sidebarBg = zones.sidebarBg || (c.sidebarDark ? 'var(--surface-950, #09090b)' : 'var(--surface-card)');

  return {
    primePreset: c.primePreset, primePrimary: c.primePrimary, primeSurface: c.primeSurface, primeDark: c.primeDark,
    radiusBase: SHAPE_RADIUS[c.shape], radiusCard: CARD_RADIUS[c.shape],
    radiusDialog: DIALOG_RADIUS[c.shape], radiusTable: SHAPE_RADIUS[c.shape],
    fontFamily: c.fontEntries[0]?.font ?? "'Lato', sans-serif",
    arabicFontFamily: c.fontEntries.find(e => e.lang === 'Arabic')?.font,
    fontEntries: c.fontEntries,
    fontSizeBase: c.fontSizeBase,
    headingWeight: '600',
    bodyWeight: c.bodyWeight,
    bodyLineHeight: c.bodyLineHeight,
    letterSpacing: c.bodyLetterSpacing,
    bodyColor: c.bodyColor,
    bodyBackground: c.bodyBackground,
    cardShadow: cardShadow[c.cardStyle], cardBorder: cardBorder[c.cardStyle],
    dialogHeaderBg: dialogHeaderBg[c.dialogStyle], dialogHeaderColor: dialogHeaderColor[c.dialogStyle],
    dialogBorder: dialogBorder[c.dialogStyle],
    tableStriped: c.tableStyle === 'striped',
    topbarBg, topbarColor, sidebarBg,
    buttonRadius: BTN_RADIUS[c.buttonShape],
    buttonPadding: btnSizeMap[cd.buttonSize],
    buttonTextTransform: 'none', buttonFontWeight: '500',
  };
}

export function applyComponentDetails(cd: ComponentDetails, root: HTMLElement): void {
  const separatorMap: Record<TableRowSeparator, string> = {
    none: 'none', thin: '1px solid var(--surface-border)',
    thick: '2px solid var(--surface-border)', colored: '1px solid var(--primary-color)',
  };
  root.style.setProperty('--app-table-row-separator', separatorMap[cd.tableRowSeparator]);
  root.style.setProperty('--app-table-col-separator', cd.tableColumnSeparator ? '1px solid var(--surface-border)' : 'none');
  const headerBgMap: Record<TableHeaderStyle, string> = {
    filled: 'var(--surface-ground)',
    gradient: 'linear-gradient(90deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #8b5cf6))',
    minimal: 'transparent',
  };
  root.style.setProperty('--app-table-header-style-bg', headerBgMap[cd.tableHeaderStyle]);
  if (cd.tableHoverColor) root.style.setProperty('--app-table-hover-bg', cd.tableHoverColor);
  const btnShadowMap: Record<ButtonShadow, string> = {
    none: 'none', soft: '0 2px 8px rgba(0,0,0,0.12)', lifted: '0 4px 16px rgba(0,0,0,0.2)',
  };
  root.style.setProperty('--app-btn-box-shadow', btnShadowMap[cd.buttonShadow]);
  const btnSizeMap: Record<ButtonSize, string> = { sm: '0.35rem 0.85rem', md: '0.5rem 1.25rem', lg: '0.7rem 1.75rem' };
  root.style.setProperty('--app-btn-padding', btnSizeMap[cd.buttonSize]);
  const dialogHeaderHMap: Record<DialogHeaderHeight, string> = { compact: '40px', normal: '56px', tall: '72px' };
  root.style.setProperty('--app-dialog-header-height', dialogHeaderHMap[cd.dialogHeaderHeight]);
  const overlayMap: Record<DialogOverlay, string> = { light: '0.3', medium: '0.5', dark: '0.75' };
  root.style.setProperty('--app-dialog-overlay-opacity', overlayMap[cd.dialogOverlayOpacity]);
  root.style.setProperty('--app-dialog-animation', cd.dialogAnimation);
  const topbarHMap: Record<TopbarHeight, string> = { compact: '48px', normal: '64px', tall: '80px' };
  root.style.setProperty('--app-topbar-height', topbarHMap[cd.topbarHeight]);
  // Separate border-bottom from box-shadow so the SCSS can use them independently
  if (cd.topbarBorderStyle === 'shadow') {
    root.style.setProperty('--app-topbar-border', 'none');
    root.style.setProperty('--app-topbar-shadow', '0 2px 8px rgba(0,0,0,0.08)');
  } else if (cd.topbarBorderStyle === 'thin') {
    root.style.setProperty('--app-topbar-border', '1px solid var(--surface-border)');
    root.style.setProperty('--app-topbar-shadow', 'none');
  } else {
    root.style.setProperty('--app-topbar-border', 'none');
    root.style.setProperty('--app-topbar-shadow', 'none');
  }
  const sidebarWMap: Record<SidebarWidth, string> = { narrow: '200px', normal: '240px', wide: '280px' };
  root.style.setProperty('--app-sidebar-width', sidebarWMap[cd.sidebarWidth]);
  root.style.setProperty('--app-sidebar-icons-only', cd.sidebarIconsOnly ? '1' : '0');
  root.style.setProperty('--app-login-layout', cd.loginLayout);
}

export function applyColorZones(zones: ColorZones, root: HTMLElement): void {
  if (zones.bodyBg)        root.style.setProperty('--app-body-bg',         zones.bodyBg);
  if (zones.sidebarBg)     root.style.setProperty('--app-sidebar-bg',      zones.sidebarBg);
  if (zones.topbarBg)      root.style.setProperty('--app-topbar-bg',       zones.topbarBg);
  if (zones.cardBg)        root.style.setProperty('--app-card-bg',         zones.cardBg);
  if (zones.primaryAccent) root.style.setProperty('--app-accent-override', zones.primaryAccent);
  if (zones.textColor)     root.style.setProperty('--app-text-override',   zones.textColor);
}

const ACTIVE_PERSONALITY_KEY = 'app_active_personality';
const CUSTOM_PERSONALITY_KEY = 'app_custom_personality';

@Injectable({ providedIn: 'root' })
export class ThemePersonalityService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly personalities = PERSONALITIES;
  readonly activeKey = signal<string>(this._loadActiveKey());
  readonly customPersonality = signal<CustomPersonality>(this._loadCustom());
  readonly activePersonality = computed(() =>
    PERSONALITIES.find(p => p.key === this.activeKey()) ?? PERSONALITIES[0]
  );

  applyPersonality(tokens: Partial<PersonalityTokens>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.documentElement;
    if (tokens.radiusBase)         root.style.setProperty('--border-radius',            tokens.radiusBase);
    if (tokens.radiusBase)         root.style.setProperty('--p-border-radius-sm',       tokens.radiusBase);
    if (tokens.radiusCard)         root.style.setProperty('--app-card-radius',           tokens.radiusCard);
    if (tokens.radiusDialog)       root.style.setProperty('--app-dialog-radius',         tokens.radiusDialog);
    if (tokens.radiusTable)        root.style.setProperty('--app-table-radius',          tokens.radiusTable);
    if (tokens.fontFamily)         { root.style.setProperty('--app-font-family', tokens.fontFamily); document.body.style.fontFamily = tokens.fontFamily; }
    if (tokens.arabicFontFamily)   { root.style.setProperty('--app-font-arabic', tokens.arabicFontFamily); }
    // Apply per-language font variables from fontEntries (custom builder)
    if (tokens.fontEntries) {
      tokens.fontEntries.forEach((entry, i) => {
        const cssVar = LANG_CSS_VAR[entry.lang] ?? `--app-font-custom-${i}`;
        root.style.setProperty(cssVar, entry.font);
        if (i === 0) { // primary always drives the main font var too
          root.style.setProperty('--app-font-family', entry.font);
          document.body.style.fontFamily = entry.font;
        }
      });
    }
    if (tokens.fontSizeBase)       root.style.setProperty('--app-font-size-base',        tokens.fontSizeBase);
    if (tokens.headingWeight)      root.style.setProperty('--app-heading-weight',        tokens.headingWeight);
    if (tokens.bodyWeight)         root.style.setProperty('--app-body-weight',           tokens.bodyWeight);
    if (tokens.bodyLineHeight)     root.style.setProperty('--app-line-height',           tokens.bodyLineHeight);
    if (tokens.letterSpacing)      root.style.setProperty('--app-letter-spacing',        tokens.letterSpacing);
    if (tokens.bodyColor)          root.style.setProperty('--app-body-color',            tokens.bodyColor);
    if (tokens.bodyBackground)     root.style.setProperty('--app-body-bg',               tokens.bodyBackground);
    if (tokens.cardShadow)         root.style.setProperty('--app-card-shadow',           tokens.cardShadow);
    if (tokens.cardBorder)         root.style.setProperty('--app-card-border',           tokens.cardBorder);
    if (tokens.dialogShadow)       root.style.setProperty('--app-dialog-shadow',         tokens.dialogShadow);
    if (tokens.dialogBorder)       root.style.setProperty('--app-dialog-border',         tokens.dialogBorder);
    if (tokens.dialogHeaderBg)     root.style.setProperty('--app-dialog-header-bg',      tokens.dialogHeaderBg);
    if (tokens.dialogHeaderColor)  root.style.setProperty('--app-dialog-header-color',   tokens.dialogHeaderColor);
    if (tokens.tableHeaderBg)      root.style.setProperty('--app-table-header-bg',       tokens.tableHeaderBg);
    if (tokens.tableRowHeight)     root.style.setProperty('--app-table-row-height',      tokens.tableRowHeight);
    root.style.setProperty('--app-table-striped', tokens.tableStriped ? '1' : '0');
    if (tokens.topbarBg)           root.style.setProperty('--app-topbar-bg',             tokens.topbarBg);
    if (tokens.topbarColor)        root.style.setProperty('--app-topbar-color',          tokens.topbarColor);
    if (tokens.sidebarBg)          root.style.setProperty('--app-sidebar-bg',            tokens.sidebarBg);
    if (tokens.sidebarActiveColor) root.style.setProperty('--app-sidebar-active-color',  tokens.sidebarActiveColor);
    if (tokens.buttonRadius)       root.style.setProperty('--app-btn-radius',            tokens.buttonRadius);
    if (tokens.buttonPadding)      root.style.setProperty('--app-btn-padding',           tokens.buttonPadding);
    if (tokens.buttonTextTransform)root.style.setProperty('--app-btn-transform',         tokens.buttonTextTransform);
    if (tokens.buttonFontWeight)   root.style.setProperty('--app-btn-weight',            tokens.buttonFontWeight);
    if (tokens.cardPadding)        root.style.setProperty('--app-card-padding',          tokens.cardPadding);
  }

  setActive(key: string): void {
    this.activeKey.set(key);
    if (isPlatformBrowser(this.platformId)) localStorage.setItem(ACTIVE_PERSONALITY_KEY, key);
  }

  saveCustom(c: CustomPersonality): void {
    this.customPersonality.set(c);
    if (isPlatformBrowser(this.platformId)) localStorage.setItem(CUSTOM_PERSONALITY_KEY, JSON.stringify(c));
  }

  private _loadActiveKey(): string {
    if (!isPlatformBrowser(this.platformId)) return PERSONALITIES[0].key;
    return localStorage.getItem(ACTIVE_PERSONALITY_KEY) ?? PERSONALITIES[0].key;
  }

  private _loadCustom(): CustomPersonality {
    if (!isPlatformBrowser(this.platformId)) return { ...DEFAULT_CUSTOM, fontEntries: [...DEFAULT_FONT_ENTRIES] };
    try {
      const raw = localStorage.getItem(CUSTOM_PERSONALITY_KEY);
      if (!raw) return { ...DEFAULT_CUSTOM, fontEntries: [...DEFAULT_FONT_ENTRIES] };
      const parsed = JSON.parse(raw);

      // ── Migration: old format used fontFamily + useSecondaryFont + secondaryFontFamily ──
      let fontEntries: FontEntry[] = parsed.fontEntries ?? [];
      if (!fontEntries.length) {
        fontEntries = [{ lang: 'English / Latin', font: parsed.fontFamily ?? "'Lato', sans-serif" }];
        if (parsed.useSecondaryFont && parsed.secondaryFontFamily) {
          fontEntries.push({ lang: 'Arabic', font: parsed.secondaryFontFamily });
        }
      }

      return {
        ...DEFAULT_CUSTOM,
        ...parsed,
        fontEntries,
        colorZones: { ...DEFAULT_COLOR_ZONES, ...(parsed.colorZones ?? {}) },
        componentDetails: { ...DEFAULT_COMPONENT_DETAILS, ...(parsed.componentDetails ?? {}) },
      };
    } catch { return { ...DEFAULT_CUSTOM, fontEntries: [...DEFAULT_FONT_ENTRIES] }; }
  }
}