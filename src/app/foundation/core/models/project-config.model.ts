// ── Runtime project config (used internally by the app) ──────────────────────

export interface ProjectConfig {
  id: string;
  projectName: string;
  websiteTitle: string;
  /** Hex color string e.g. "#D94452" or "rgb(154,98,210)" */
  primaryColor: string;
  /** Raw SVG string rendered inline (supports CSS variables) */
  logoSvg: string;
  /** Optional dark-mode SVG variant; falls back to logoSvg if null */
  logoSvgDark: string | null;
  /** Optional square SVG used as browser favicon (data URI); falls back to logoSvg if null */
  faviconSvg: string | null;
  /** The project loaded by default on startup */
  isDefault?: boolean;
}

// ── Input config schema (what arrives in the YAML / JSON file) ────────────────

export interface ConfigInputSubModule {
  id: string;
  label: string;
  icon?: string;
  /** e.g. "/org/communities" */
  path: string;
  /** default true */
  enabled?: boolean;
}

export interface ConfigInputModule {
  id: string;
  label: string;
  icon?: string;
  /** API base URL for this module's DataTablePage */
  apiUrl: string;
  /** Optional fallback JSON files for offline/demo mode */
  fallbackJsonAr?: string;
  fallbackJsonEn?: string;
  /** Field used as row identifier (default: "id") */
  idField?: string;
  /** Which CRUD actions to show (default: all true) */
  actions?: {
    create?: boolean;
    edit?: boolean;
    view?: boolean;
    delete?: boolean;
  };
  /** default true */
  enabled?: boolean;
  subModules?: ConfigInputSubModule[];
}

export interface ConfigInputDomain {
  id: string;
  label: string;
  /** default true */
  enabled?: boolean;
  modules: ConfigInputModule[];
}

// ── Color zones (optional per-theme overrides in the YAML) ───────────────────

export interface ColorZoneTokens {
  /** --app-topbar-bg */
  topbarBg?: string;
  /** --app-topbar-color */
  topbarColor?: string;
  /** --app-topbar-border */
  topbarBorder?: string;
  /** --app-topbar-shadow */
  topbarShadow?: string;

  /** --app-sidebar-bg */
  sidebarBg?: string;
  /** --app-sidebar-active-color */
  sidebarActiveColor?: string;

  /** --app-body-bg */
  bodyBg?: string;
  /** --app-body-color */
  bodyColor?: string;
  /** --app-text-override */
  textOverride?: string;

  /** --app-card-bg */
  cardBg?: string;
  /** --app-card-border */
  cardBorder?: string;
  /** --app-card-shadow */
  cardShadow?: string;

  /** --app-dialog-header-bg */
  dialogHeaderBg?: string;
  /** --app-dialog-header-color */
  dialogHeaderColor?: string;
  /** --app-dialog-border */
  dialogBorder?: string;
  /** --app-dialog-shadow */
  dialogShadow?: string;

  /** --app-table-header-bg */
  tableHeaderBg?: string;
  /** --app-table-hover-bg */
  tableHoverBg?: string;

  /** --app-accent-override */
  accentOverride?: string;
}

export interface ProjectColorConfig {
  /** Seed hex — drives the PrimeNG palette (--primary-color) */
  primary?: string;
  light?: ColorZoneTokens;
  dark?: ColorZoneTokens;
}

// ── Component-level fine-grained style ────────────────────────────────────────
// منقولة من ui-style-designer.model.ts (Step 1 — توحيد الموديل، يونيو 2026).
// دي الشكل اللي بتطلعه شاشة الـ UI Style Designer (padding/margin/border/font
// بالـ px والـ boolean toggles) — مختلفة عن TableStyleConfig/DialogStyleConfig
// تحت دي اللي بتوصف "نمط" عام (striped/bordered/...) جاي من اليامل/الـ personality.
// الاتنين بيتقابلوا في حقل `advanced?` تحت في كل StyleConfig.

export type SubElementKey =
  | 'title' | 'body' | 'footer'   // card
  | 'header' | 'row'              // table / dialog header
  | 'content';                    // sidebar / shapes

export interface SubElementStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'Regular' | 'Medium' | 'Bold';
  fontColor: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export const DEFAULT_SUB_ELEMENT_STYLE: SubElementStyle = {
  fontFamily: 'Geometric Sans',
  fontSize: 14,
  fontWeight: 'Medium',
  fontColor: '#FFFFFF',
  textAlign: 'left',
};

export const FONT_FAMILIES = [
  'Geometric Sans', 'Inter', 'Lato', 'Cairo', 'Roboto',
  'Open Sans', 'Nunito', 'Source Sans 3', 'Georgia', 'JetBrains Mono',
];

export interface ComponentStyleConfig {
  // Shape & Depth
  cornerRadius: number;
  elevationShadow: boolean;
  width: 'standard' | 'highlighted';

  // Stroke & Color
  internalPadding: number;
  border: boolean;
  borderWidth: number;
  borderColor: string;

  // Layout & Spacing
  externalMargin: number;

  // Typography
  fontFamily: string;
  fontWeight: 'Regular' | 'Medium' | 'Bold';

  // Sub-element overrides
  subElements: Partial<Record<SubElementKey, SubElementStyle>>;
}

export const DEFAULT_COMPONENT_STYLE: ComponentStyleConfig = {
  cornerRadius: 8,
  elevationShadow: false,
  width: 'standard',
  internalPadding: 0,
  border: false,
  borderWidth: 2,
  borderColor: '#A0A0A0',
  externalMargin: 16,
  fontFamily: 'Geometric Sans',
  fontWeight: 'Medium',
  subElements: {},
};

// ── Component style config (table / dialog / card / topbar / sidebar / button / login) ──
// من Component Style Config spec. كل field اختياري — لو مش محدد ياخد default من
// الـ personality النشطة (theme-personality.service.ts). الـ YAML له الـ override
// لو في تعارض مع الـ personality.

export type ComponentShape = 'sharp' | 'rounded' | 'soft' | 'pill';

export type TableStyle = 'default' | 'striped' | 'bordered' | 'minimal';
export type TableHeaderStyle = 'filled' | 'gradient' | 'minimal';
export type TableRowSeparator = 'none' | 'thin' | 'thick' | 'colored';

export interface TableStyleConfig {
  style?: TableStyle;
  headerStyle?: TableHeaderStyle;
  rowSeparator?: TableRowSeparator;
  columnSeparator?: boolean;
  rowHeight?: 'compact' | 'normal' | 'spacious';
  shape?: ComponentShape;
  /** تخصيص دقيق (padding/margin/border/font) من شاشة UI Style Designer */
  advanced?: ComponentStyleConfig;
}

export type DialogStyle = 'flat' | 'accent-header' | 'gradient-header' | 'outlined';
export type DialogHeaderHeight = 'compact' | 'normal' | 'tall';
export type DialogOverlay = 'light' | 'medium' | 'dark';
export type DialogAnimation = 'fade' | 'slide' | 'zoom';

export interface DialogStyleConfig {
  style?: DialogStyle;
  headerHeight?: DialogHeaderHeight;
  overlayOpacity?: DialogOverlay;
  animation?: DialogAnimation;
  shape?: ComponentShape;
  /** تخصيص دقيق (padding/margin/border/font) من شاشة UI Style Designer */
  advanced?: ComponentStyleConfig;
}

export type CardStyle = 'elevated' | 'bordered' | 'flat' | 'glass';

export interface CardStyleConfig {
  style?: CardStyle;
  shape?: ComponentShape;
  /** تخصيص دقيق (padding/margin/border/font) من شاشة UI Style Designer */
  advanced?: ComponentStyleConfig;
}

export type TopbarHeight = 'compact' | 'normal' | 'tall';
export type TopbarBorderStyle = 'none' | 'thin' | 'shadow';
export type TopbarLogoStyle = 'icon-text' | 'icon-only' | 'text-only' | 'hidden';
export type TopbarNavAlign = 'left' | 'center' | 'right';
export type TopbarNavStyle = 'links' | 'pills' | 'underline' | 'buttons';

export interface TopbarStyleConfig {
  height?: TopbarHeight;
  border?: TopbarBorderStyle;
  logoStyle?: TopbarLogoStyle;
  navAlign?: TopbarNavAlign;
  navStyle?: TopbarNavStyle;
  showLang?: boolean;
  showTheme?: boolean;
  showConfig?: boolean;
  showSearch?: boolean;
  showNotif?: boolean;
  // ملحوظة: 'topbar' مش من ضمن ComponentKey بتاعة ui-style-designer دلوقتي
  // (tables | sidebars | cards | dialogs | shapes بس) — فمفيش `advanced?` هنا
  // لحد ما يتقرر هل التوبار هيتضاف كـ component key سادس ولا لأ.
}

export type SidebarWidth = 'narrow' | 'normal' | 'wide';

export interface SidebarStyleConfig {
  width?: SidebarWidth;
  iconsOnly?: boolean;
  /** تخصيص دقيق (padding/margin/border/font) من شاشة UI Style Designer */
  advanced?: ComponentStyleConfig;
}

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShadow = 'none' | 'soft' | 'lifted';

export interface ButtonStyleConfig {
  size?: ButtonSize;
  shadow?: ButtonShadow;
  shape?: ComponentShape;
  // نفس ملحوظة الـ topbar: 'button' مش ComponentKey مستقل دلوقتي، هو غالبًا
  // نفس حاجة 'shapes' في ui-style-designer لكن مش متربط رسميًا — يحتاج قرار.
}

export type LoginLayout = 'centered' | 'split' | 'fullscreen';
export type LoginBg = 'solid' | 'gradient' | 'image';
export type LoginLogoPos = 'top' | 'left' | 'hidden';

export interface LoginStyleConfig {
  layout?: LoginLayout;
  bg?: LoginBg;
  bgColor?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  logoPos?: LoginLogoPos;
}

export interface ProjectStyleConfig {
  table?: TableStyleConfig;
  dialog?: DialogStyleConfig;
  card?: CardStyleConfig;
  topbar?: TopbarStyleConfig;
  sidebar?: SidebarStyleConfig;
  button?: ButtonStyleConfig;
  login?: LoginStyleConfig;
}

/** Top-level shape of the YAML / JSON config file */
export interface ProjectConfigInput {
  // ── Branding ──────────────────────────────────────────────
  id: string;
  projectName: string;
  websiteTitle: string;
  primaryColor: string;
  logoSvg?: string;
  logoSvgDark?: string;

  // ── Color overrides (optional) ────────────────────────────
  // ملحوظة: فاضلة top-level زي ما هي شغالة فعليًا في project-config.service.ts
  // الحالي (input.colors)، مش متداخلة جوه style — الـ spec الأصلي كان مقترح
  // ينقلها جوه style.colors بس ده لسه ما اتنفذش في الكود الشغال.
  colors?: ProjectColorConfig;

  // ── Component style overrides (optional) ──────────────────
  style?: ProjectStyleConfig;

  // ── Structure ─────────────────────────────────────────────
  domains: ConfigInputDomain[];
}