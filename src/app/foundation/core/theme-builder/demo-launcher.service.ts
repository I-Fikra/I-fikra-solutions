import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeConfigurationStore } from './theme-configuration.store';
import { BrandingService } from '@/app/services/sol/configuration/infrastructure/branding.service';
import { ConfigDataService, ConfigModule } from '@/app/services/sol/configuration/infrastructure/config-data.service';
import { UIStyleDesignerService } from '@/app/foundation/core/ui-style-designer/ui-style-designer.service';
import {
  ProjectConfigInput,
  ConfigInputDomain,
  ConfigInputModule,
  ProjectStyleConfig,
} from '@/app/foundation/core/models/project-config.model';

const DEMO_URL                = 'https://platform-demo-chi.vercel.app/';
const DEMO_PROJECT_CONFIG_KEY = 'demo_project_config';
const DEMO_THEME_CONFIG_KEY   = 'theme_preview_config';
const BROADCAST_CHANNEL_NAME  = 'theme_preview_channel';

// ── Fallback domains لو اليوزر ما اختارش حاجة لسه من شاشة الـ Domains ──────
const FALLBACK_DOMAINS: ConfigInputDomain[] = [
  {
    id: 'content',
    label: 'المحتوى',
    modules: [
      {
        id: 'courses',
        label: 'الكورسات',
        icon: 'pi pi-book',
        apiUrl: '/api/lms-courses-ar.json',
        fallbackJsonAr: '/api/lms-courses-ar.json',
        fallbackJsonEn: '/api/lms-courses-en.json',
        idField: 'course_id',
        actions: { create: true, edit: true, view: true, delete: true },
      },
      {
        id: 'categories',
        label: 'التصنيفات',
        icon: 'pi pi-tags',
        apiUrl: '/api/categories-ar.json',
        fallbackJsonAr: '/api/categories-ar.json',
        fallbackJsonEn: '/api/categories-en.json',
        idField: 'id',
        actions: { create: true, edit: true, view: true, delete: true },
      },
    ],
  },
  {
    id: 'learners',
    label: 'المتعلمون',
    modules: [
      {
        id: 'students',
        label: 'الطلاب',
        icon: 'pi pi-users',
        apiUrl: '/api/lms-students-ar.json',
        fallbackJsonAr: '/api/lms-students-ar.json',
        fallbackJsonEn: '/api/lms-students-en.json',
        idField: 'student_id',
        actions: { create: true, edit: true, view: true, delete: false },
      },
    ],
  },
];

/**
 * بيحوّل ConfigModule[] (المختارة من شاشة الـ Domains/wizard) لـ ConfigInputDomain[]
 * (شكل الـ YAML/ProjectConfigInput). بيجمّع الـ modules حسب الـ domain field بتاعها.
 */
function buildDomainsFromModules(modules: ConfigModule[]): ConfigInputDomain[] {
  const selected = modules.filter((m) => m.selected);
  if (selected.length === 0) return FALLBACK_DOMAINS;

  const domainMap = new Map<string, ConfigInputDomain>();

  for (const mod of selected) {
    const domainId = mod.domain ?? mod.key;
    if (!domainMap.has(domainId)) {
      domainMap.set(domainId, {
        id: domainId,
        label: domainId.charAt(0).toUpperCase() + domainId.slice(1),
        modules: [],
      });
    }

    const inputModule: ConfigInputModule = {
      id: mod.key,
      label: mod.label,
      icon: mod.icon,
      // مسار افتراضي للـ JSON في الـ demo بناءً على اسم الـ module
      apiUrl: `/api/${mod.key}-ar.json`,
      fallbackJsonAr: `/api/${mod.key}-ar.json`,
      fallbackJsonEn: `/api/${mod.key}-en.json`,
      idField: 'id',
      actions: { create: true, edit: true, view: true, delete: true },
    };

    domainMap.get(domainId)!.modules.push(inputModule);
  }

  return Array.from(domainMap.values());
}

@Injectable({ providedIn: 'root' })
export class DemoLauncherService {
  private readonly store      = inject(ThemeConfigurationStore);
  private readonly branding   = inject(BrandingService);
  private readonly configData = inject(ConfigDataService);
  private readonly uiStyle    = inject(UIStyleDesignerService);
  private readonly platformId = inject(PLATFORM_ID);

  /** BroadcastChannel للـ real-time sync مع الـ demo tab */
  private readonly channel: BroadcastChannel | null =
    isPlatformBrowser(this.platformId) && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      : null;

  constructor() {
    // ── Real-time sync: ابعت كل تغيير في الـ theme (debounced 300ms) ────────
    if (isPlatformBrowser(this.platformId)) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      effect(() => {
        const cfg = this.store.snapshot();
        if (!this.channel) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try {
            this.channel!.postMessage({ type: 'theme_update', payload: cfg });
          } catch {
            // channel closed — silently ignore
          }
        }, 300);
      });
    }
  }

  /** بيفتح tab جديد للـ demo + يبعتله الـ config الحالي (theme + domains + style) */
  openDemo(): void {
    const projectConfig = this._buildProjectConfig();

    // ── احفظ في localStorage (للـ initial load لو الـ demo اتفتح بعدين) ───
    try {
      localStorage.setItem(DEMO_PROJECT_CONFIG_KEY, JSON.stringify(projectConfig));
      localStorage.setItem(DEMO_THEME_CONFIG_KEY,   JSON.stringify(this.store.snapshot()));
    } catch {
      // quota exceeded — silently ignore
    }

    // ── ابعت على الـ BroadcastChannel فورًا (لو فيه tab شغال بالفعل) ───────
    try {
      this.channel?.postMessage({ type: 'theme_update', payload: this.store.snapshot() });
      this.channel?.postMessage({ type: 'project_config_update', payload: projectConfig });
    } catch {
      // channel not available — silently ignore
    }

    // ── افتح الـ demo ───────────────────────────────────────────────────────
    window.open(DEMO_URL, '_blank');
  }

  /** بيبعت الـ config الحالي لأي demo tab مفتوح بالفعل، من غير ما يفتح tab جديد */
  syncToDemo(): void {
    const projectConfig = this._buildProjectConfig();
    try {
      this.channel?.postMessage({ type: 'theme_update', payload: this.store.snapshot() });
      this.channel?.postMessage({ type: 'project_config_update', payload: projectConfig });
    } catch {
      // channel not available — silently ignore
    }
  }

  // ── Builder ──────────────────────────────────────────────────────────────

  private _buildProjectConfig(): ProjectConfigInput {
    // ── Branding ────────────────────────────────────────────────────────────
    const appName      = this.branding.appName();
    const themeColor   = this.branding.themeColor();
    const logoSvg      = this.branding.logo() ?? undefined;

    const projectName  = appName?.['ar'] || appName?.['en'] || 'LearnHub LMS';
    const websiteTitle = `${projectName} — منصة التعلم الإلكتروني`;
    const primaryColor = themeColor || '#059669';

    // ── Domains (من شاشة الـ Domains — لو فاضية يستخدم fallback LMS) ────────
    const domains = buildDomainsFromModules(this.configData.selectedModules());

    // ── Style overrides من UIStyleDesignerService ────────────────────────────
    const style = this._buildStyleConfig();

    return {
      id:           'demo',
      projectName,
      websiteTitle,
      primaryColor,
      ...(logoSvg ? { logoSvg } : {}),
      domains,
      style,
    };
  }

  /**
   * يحوّل UIStyleConfig (شكل الـ designer: tables/sidebars/cards/dialogs/shapes)
   * لـ ProjectStyleConfig (شكل الـ YAML) بوضع كل component config في حقل
   * `advanced` المناسب. 'shapes' مفيهوش مكان مخصص في ProjectStyleConfig حاليًا
   * فبيتسيب — القرار ده موثّق في project-config.model.ts (ملاحظة الـ button/topbar).
   */
  private _buildStyleConfig(): ProjectStyleConfig {
    const cfg = this.uiStyle.config();
    return {
      table:   { advanced: cfg.tables   },
      dialog:  { advanced: cfg.dialogs  },
      card:    { advanced: cfg.cards    },
      sidebar: { advanced: cfg.sidebars },
    };
  }
}
