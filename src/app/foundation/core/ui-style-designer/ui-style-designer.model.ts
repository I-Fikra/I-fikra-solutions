// ── شكل الداتا (ComponentStyleConfig, SubElementStyle, ...) اتنقل لـ
// project-config.model.ts (Step 1 — توحيد الموديل، يونيو 2026) عشان يبقى
// نفس الـ shape اللي بيتقرى من/يتكتب في اليامل عن طريق ProjectConfigService.
// الملف ده فضل بس للحاجات الخاصة بواجهة شاشة الـ designer نفسها.

export * from '@/app/foundation/core/models/project-config.model';

import {
  ComponentStyleConfig,
  DEFAULT_COMPONENT_STYLE,
  SubElementKey,
} from '@/app/foundation/core/models/project-config.model';

export type ComponentKey = 'tables' | 'sidebars' | 'cards' | 'dialogs' | 'shapes';

// ── Per-component sub-elements ────────────────────────────────────────────────

export const COMPONENT_SUB_ELEMENTS: Record<ComponentKey, { key: SubElementKey; label: string }[]> = {
  cards:    [
    { key: 'title',  label: 'Title Style'  },
    { key: 'body',   label: 'Body Style'   },
    { key: 'footer', label: 'Footer Style' },
  ],
  dialogs:  [
    { key: 'header', label: 'Header Style' },
    { key: 'body',   label: 'Body Style'   },
    { key: 'footer', label: 'Footer Style' },
  ],
  tables:   [
    { key: 'header', label: 'Header Style' },
    { key: 'row',    label: 'Row Style'    },
  ],
  sidebars: [{ key: 'content', label: 'Content Style' }],
  shapes:   [{ key: 'content', label: 'Content Style' }],
};

// ── Main component style config ───────────────────────────────────────────────

export type UIStyleConfig = Record<ComponentKey, ComponentStyleConfig>;

export const DEFAULT_UI_STYLE_CONFIG: UIStyleConfig = {
  tables:   { ...DEFAULT_COMPONENT_STYLE, subElements: {} },
  sidebars: { ...DEFAULT_COMPONENT_STYLE, subElements: {} },
  cards:    { ...DEFAULT_COMPONENT_STYLE, cornerRadius: 12, subElements: {} },
  dialogs:  { ...DEFAULT_COMPONENT_STYLE, cornerRadius: 16, elevationShadow: true, subElements: {} },
  shapes:   { ...DEFAULT_COMPONENT_STYLE, subElements: {} },
};

export const COMPONENT_META: Record<ComponentKey, { label: string; icon: string; cssTarget: string }> = {
  tables:   { label: 'Tables',   icon: 'pi-table',          cssTarget: '.p-datatable' },
  sidebars: { label: 'Sidebars', icon: 'pi-table-columns',  cssTarget: '.layout-sidebar' },
  cards:    { label: 'Cards',    icon: 'pi-id-card',        cssTarget: '.p-card' },
  dialogs:  { label: 'Dialogs',  icon: 'pi-comment',        cssTarget: '.p-dialog' },
  shapes:   { label: 'Shapes',   icon: 'pi-stop',           cssTarget: '.ui-shape' },
};

export const COMPONENT_KEYS: ComponentKey[] = ['tables', 'sidebars', 'cards', 'dialogs', 'shapes'];