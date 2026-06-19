/**
 * theme-configuration.model.ts
 *
 * Standalone config interfaces for every customisable component.
 * Each interface owns only the fields relevant to it and ships with a
 * DEFAULT_* constant so consumers never need to supply a full object.
 *
 * Source of truth for Step 2 of the Theme-Builder Refactor.
 * Derived from CustomPersonality / ComponentDetails in theme-personality.service.ts
 * — those types are kept untouched for backward compatibility.
 */

// ── Re-export primitive types so consumers import from one place ──────────────

export type ComponentShape    = 'sharp' | 'rounded' | 'soft' | 'pill';
export type CardStyle         = 'elevated' | 'bordered' | 'flat' | 'glass';

export type TableStyle        = 'default' | 'striped' | 'bordered' | 'minimal';
export type TableRowSeparator = 'none' | 'thin' | 'thick' | 'colored';
export type TableHeaderStyle  = 'filled' | 'gradient' | 'minimal';

export type ButtonSize        = 'sm' | 'md' | 'lg';
export type ButtonShadow      = 'none' | 'soft' | 'lifted';
export type ButtonIconPos     = 'left' | 'right';

export type DialogStyle       = 'flat' | 'accent-header' | 'gradient-header' | 'outlined' | 'popup';
export type DialogHeaderHeight = 'compact' | 'normal' | 'tall';
export type DialogOverlay     = 'light' | 'medium' | 'dark';
export type DialogAnimation   = 'fade' | 'slide' | 'zoom';

export type TopbarHeight      = 'compact' | 'normal' | 'tall';
export type TopbarBorder      = 'none' | 'thin' | 'shadow';
export type TopbarLogoStyle   = 'icon-text' | 'icon-only' | 'text-only' | 'hidden';
export type TopbarNavAlign    = 'left' | 'center' | 'right';
export type TopbarNavStyle    = 'links' | 'pills' | 'underline' | 'buttons';

export type SidebarWidth      = 'narrow' | 'normal' | 'wide';

export type LoginLayout       = 'centered' | 'split' | 'fullscreen';
export type LoginBg           = 'solid' | 'gradient' | 'image';
export type LoginLogoPos      = 'top' | 'left' | 'hidden';

// ── Shared sub-types ──────────────────────────────────────────────────────────

export interface TopbarNavItem {
  id:      string;
  label:   string;
  icon:    string;
  route:   string;
  enabled: boolean;
}

export interface FontEntry {
  lang: string;   // key from LANG_CSS_VAR  e.g. 'Arabic'
  font: string;   // CSS font-family value  e.g. "'Cairo', sans-serif"
}

// ── Radius lookup maps (shared across configs) ────────────────────────────────

export const SHAPE_RADIUS_MAP:  Record<ComponentShape, string> = {
  sharp:   '2px',
  rounded: '6px',
  soft:    '14px',
  pill:    '999px',
};

export const BTN_RADIUS_MAP:    Record<ComponentShape, string> = {
  sharp:   '3px',
  rounded: '6px',
  soft:    '12px',
  pill:    '999px',
};

export const CARD_RADIUS_MAP:   Record<ComponentShape, string> = {
  sharp:   '4px',
  rounded: '10px',
  soft:    '18px',
  pill:    '24px',
};

export const DIALOG_RADIUS_MAP: Record<ComponentShape, string> = {
  sharp:   '4px',
  rounded: '12px',
  soft:    '20px',
  pill:    '28px',
};

// ── 1. ShapeConfig ────────────────────────────────────────────────────────────

export interface ShapeConfig {
  /** Global shape applied to all components */
  globalShape: ComponentShape;
  /** Card style (shadow / border / flat / glass) */
  cardStyle: CardStyle;
}

export const DEFAULT_SHAPE_CONFIG: ShapeConfig = {
  globalShape: 'rounded',
  cardStyle:   'elevated',
};

// ── 2. FontConfig ─────────────────────────────────────────────────────────────

export interface FontConfig {
  /** Per-language font entries; index 0 = primary (Latin) font */
  entries:          FontEntry[];
  fontSizeBase:     string;
  scaleRatio:       string;
  bodyWeight:       string;
  bodyLineHeight:   string;
  bodyLetterSpacing: string;
  bodyColor:        string;
  bodyBackground:   string;
  /** Responsive overrides (optional) */
  responsiveMinWidth:  string;
  responsiveFontSize:  string;
  responsiveScale:     string;
}

export const DEFAULT_FONT_CONFIG: FontConfig = {
  entries: [
    { lang: 'English / Latin', font: "'Lato', sans-serif"  },
    { lang: 'Arabic',          font: "'Cairo', sans-serif" },
  ],
  fontSizeBase:        '14px',
  scaleRatio:          '1.250',
  bodyWeight:          '400',
  bodyLineHeight:      '1.5',
  bodyLetterSpacing:   '0em',
  bodyColor:           '#1e293b',
  bodyBackground:      '#ffffff',
  responsiveMinWidth:  '',
  responsiveFontSize:  '',
  responsiveScale:     'inherit',
};

// ── 3. ButtonConfig ───────────────────────────────────────────────────────────

export interface ButtonConfig {
  shape:   ComponentShape;
  size:    ButtonSize;
  shadow:  ButtonShadow;
  iconPos: ButtonIconPos;
}

export const DEFAULT_BUTTON_CONFIG: ButtonConfig = {
  shape:   'rounded',
  size:    'md',
  shadow:  'none',
  iconPos: 'left',
};

// ── 4. DialogConfig ───────────────────────────────────────────────────────────

export interface DialogConfig {
  style:          DialogStyle;
  headerHeight:   DialogHeaderHeight;
  overlayOpacity: DialogOverlay;
  animation:      DialogAnimation;
}

export const DEFAULT_DIALOG_CONFIG: DialogConfig = {
  style:          'flat',
  headerHeight:   'normal',
  overlayOpacity: 'medium',
  animation:      'fade',
};

// ── 5. TableConfig ────────────────────────────────────────────────────────────

export interface TableConfig {
  style:           TableStyle;
  rowSeparator:    TableRowSeparator;
  columnSeparator: boolean;
  headerStyle:     TableHeaderStyle;
  hoverColor:      string;
}

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  style:           'default',
  rowSeparator:    'thin',
  columnSeparator: false,
  headerStyle:     'filled',
  hoverColor:      '',
};

// ── 6. TopbarConfig ───────────────────────────────────────────────────────────

export interface TopbarConfig {
  height:       TopbarHeight;
  borderStyle:  TopbarBorder;
  accented:     boolean;
  logoStyle:    TopbarLogoStyle;
  navAlign:     TopbarNavAlign;
  navStyle:     TopbarNavStyle;
  navItems:     TopbarNavItem[];
  showLang:     boolean;
  showTheme:    boolean;
  showConfig:   boolean;
  showSearch:   boolean;
  showNotif:    boolean;
  /** Custom background color (overrides accented when set) */
  bgColor:      string;
}

export const DEFAULT_TOPBAR_CONFIG: TopbarConfig = {
  height:      'normal',
  borderStyle: 'shadow',
  accented:    false,
  logoStyle:   'icon-text',
  navAlign:    'center',
  navStyle:    'links',
  navItems:    [],
  showLang:    true,
  showTheme:   true,
  showConfig:  true,
  showSearch:  false,
  showNotif:   false,
  bgColor:     '',
};

// ── 7. SidebarConfig ──────────────────────────────────────────────────────────

export interface SidebarConfig {
  width:     SidebarWidth;
  iconsOnly: boolean;
  dark:      boolean;
  /** Custom background color */
  bgColor:   string;
}

export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  width:     'normal',
  iconsOnly: false,
  dark:      false,
  bgColor:   '',
};

// ── 8. LoginConfig ────────────────────────────────────────────────────────────

export interface LoginConfig {
  layout:       LoginLayout;
  bg:           LoginBg;
  bgColor:      string;
  bgGradientFrom: string;
  bgGradientTo:   string;
  logoPos:      LoginLogoPos;
}

export const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  layout:         'centered',
  bg:             'solid',
  bgColor:        '#f8fafc',
  bgGradientFrom: '#667eea',
  bgGradientTo:   '#764ba2',
  logoPos:        'top',
};

// ── Root ThemeConfiguration ───────────────────────────────────────────────────

export interface ThemeConfiguration {
  shape:   ShapeConfig;
  font:    FontConfig;
  button:  ButtonConfig;
  dialog:  DialogConfig;
  table:   TableConfig;
  topbar:  TopbarConfig;
  sidebar: SidebarConfig;
  login:   LoginConfig;
}

export const DEFAULT_THEME_CONFIGURATION: ThemeConfiguration = {
  shape:   { ...DEFAULT_SHAPE_CONFIG   },
  font:    { ...DEFAULT_FONT_CONFIG,   entries: [...DEFAULT_FONT_CONFIG.entries] },
  button:  { ...DEFAULT_BUTTON_CONFIG  },
  dialog:  { ...DEFAULT_DIALOG_CONFIG  },
  table:   { ...DEFAULT_TABLE_CONFIG   },
  topbar:  { ...DEFAULT_TOPBAR_CONFIG, navItems: [] },
  sidebar: { ...DEFAULT_SIDEBAR_CONFIG },
  login:   { ...DEFAULT_LOGIN_CONFIG   },
};
