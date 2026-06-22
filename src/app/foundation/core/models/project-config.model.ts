/**
 * ── project-config.model.ts ───────────────────────────────────────────────────
 *
 * بعد خطوة 18 (التنضيف):
 *
 *   - كل الـ interfaces المشتركة بين الويزارد والديمو (ProjectConfigInput,
 *     ConfigInputDomain, ProjectStyleConfig, ...) اتنقلت للـ GENERATED FILE:
 *     → project-config.generated.ts  (مولّد تلقائيًا من project-config.schema.json)
 *
 *   - الملف ده بقى مسؤول بس عن حاجتين:
 *     1. ProjectConfig — الـ runtime type بتاع الـ app (مش جزء من الـ schema)
 *     2. Constants + UI helpers (SubElementKey, defaults, FONT_FAMILIES) —
 *        بتستخدمها ui-style-designer فقط، مش جزء من العقد المشترك مع الديمو
 *
 *   - Re-exports من generated.ts عشان أي كود قديم بيستورد من هنا يفضل شغّال
 *     بدون أي تغيير في الـ import paths.
 *
 * ⚠️  لا تضيف interfaces جديدة هنا — الإضافات الجديدة تروح في project-config.schema.json
 *     وتتولّد تلقائيًا في project-config.generated.ts.
 */

// ── Import + Re-export من generated (backward compatibility) ─────────────────
// أي ملف بيستورد ProjectConfigInput / ConfigInputDomain / ProjectStyleConfig ...
// من هنا هيفضل شغّال من غير ما تعدّل الـ imports بتاعته.
//
// ملحوظة مهمة: لازم import عادي (مش "export type { ... } from") عشان الـ types
// دي تبقى متاحة داخل الملف نفسه أيضًا — مستخدمة تحت في DEFAULT_SUB_ELEMENT_STYLE
// و DEFAULT_COMPONENT_STYLE. "export type {...} from" بس بيعمل re-export للخارج
// ومايجيبش الـ types دي جوه scope الملف، فده كان سبب الخطأ:
// TS2304: Cannot find name 'SubElementStyle' / 'ComponentStyleConfig'.
import type {
  ProjectConfigInput,
  ConfigInputDomain,
  ConfigInputModule,
  ConfigInputSubModule,
  ProjectColorConfig,
  ColorZoneTokens,
  ProjectStyleConfig,
  TableStyleConfig,
  DialogStyleConfig,
  CardStyleConfig,
  TopbarStyleConfig,
  SidebarStyleConfig,
  ButtonStyleConfig,
  LoginStyleConfig,
  ComponentStyleConfig,
  SubElementStyle,
  ComponentShape,
} from './project-config.generated';

export type {
  ProjectConfigInput,
  ConfigInputDomain,
  ConfigInputModule,
  ConfigInputSubModule,
  ProjectColorConfig,
  ColorZoneTokens,
  ProjectStyleConfig,
  TableStyleConfig,
  DialogStyleConfig,
  CardStyleConfig,
  TopbarStyleConfig,
  SidebarStyleConfig,
  ButtonStyleConfig,
  LoginStyleConfig,
  ComponentStyleConfig,
  SubElementStyle,
  ComponentShape,
};

// ── Runtime project config ────────────────────────────────────────────────────
// هذا الـ type خاص بالـ app (runtime) — مش جزء من الـ schema المشترك مع الديمو.
// يُستخدم في ProjectConfigService, Platforms, etc.
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

// ── UI-only helpers (ui-style-designer فقط) ──────────────────────────────────
// هذه الـ constants لا تنتمي للـ schema المشترك — هي قرارات UI داخلية في الويزارد.

export type SubElementKey =
  | 'title' | 'body' | 'footer'   // card
  | 'header' | 'row'              // table / dialog header
  | 'content';                    // sidebar / shapes

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

// ── Alias types (backward compat للـ named union types اللي كانت موجودة) ─────
export type TableStyle         = 'default' | 'striped' | 'bordered' | 'minimal';
export type TableHeaderStyle   = 'filled' | 'gradient' | 'minimal';
export type TableRowSeparator  = 'none' | 'thin' | 'thick' | 'colored';
export type DialogStyle        = 'flat' | 'accent-header' | 'gradient-header' | 'outlined';
export type DialogHeaderHeight = 'compact' | 'normal' | 'tall';
export type DialogOverlay      = 'light' | 'medium' | 'dark';
export type DialogAnimation    = 'fade' | 'slide' | 'zoom';
export type CardStyle          = 'elevated' | 'bordered' | 'flat' | 'glass';
export type TopbarHeight       = 'compact' | 'normal' | 'tall';
export type TopbarBorderStyle  = 'none' | 'thin' | 'shadow';
export type TopbarLogoStyle    = 'icon-text' | 'icon-only' | 'text-only' | 'hidden';
export type TopbarNavAlign     = 'left' | 'center' | 'right';
export type TopbarNavStyle     = 'links' | 'pills' | 'underline' | 'buttons';
export type SidebarWidth       = 'narrow' | 'normal' | 'wide';
export type ButtonSize         = 'sm' | 'md' | 'lg';
export type ButtonShadow       = 'none' | 'soft' | 'lifted';
export type LoginLayout        = 'centered' | 'split' | 'fullscreen';
export type LoginBg            = 'solid' | 'gradient' | 'image';
export type LoginLogoPos       = 'top' | 'left' | 'hidden';
