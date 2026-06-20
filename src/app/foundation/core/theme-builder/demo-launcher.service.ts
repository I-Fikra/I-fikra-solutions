import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfigBuilderService } from '@/app/foundation/core/services/config-builder.service';
import type { ProjectConfigInput } from '@/app/foundation/core/models/project-config.generated';
import { BrandingService } from '@/app/domains/sol/configuration/infrastructure/branding.service';
import { ThemeConfigurationStore } from './theme-configuration.store';

const DEMO_URL = 'https://platform-demo-chi.vercel.app/';
const DEMO_PROJECT_CONFIG_KEY = 'demo_project_config';
const DEMO_THEME_CONFIG_KEY = 'theme_preview_config';
const BROADCAST_CHANNEL_NAME = 'theme_preview_channel';

/**
 * الـ domains الثابتة للـ LMS project.
 * بتتبعت مع كل فتح للـ demo — الـ branding بيجي من BrandingService.
 */
const LMS_DOMAINS = [
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
        actions: { create: true, edit: true, view: true, delete: true }
      },
      {
        id: 'categories',
        label: 'التصنيفات',
        icon: 'pi pi-tags',
        apiUrl: '/api/categories-ar.json',
        fallbackJsonAr: '/api/categories-ar.json',
        fallbackJsonEn: '/api/categories-en.json',
        idField: 'id',
        actions: { create: true, edit: true, view: true, delete: true }
      }
    ]
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
        actions: { create: true, edit: true, view: true, delete: false }
      }
    ]
  }
];

const DEMO_URL = 'https://platform-demo-chi.vercel.app/';

/**
 * ── DemoLauncherService ────────────────────────────────────────────────────────
 *
 * يفتح الديمو في tab جديد ويبعتله الكونفيج الحالي كامل عن طريق ?config= param
 * في الـ URL — ده يشتغل cross-origin بدون أي backend.
 *
 * الآلية:
 *   1. بياخد snapshot من ConfigBuilderService.toJSON()
 *   2. بيعمل encode: JSON → encodeURIComponent → btoa → encodeURIComponent
 *   3. بيفتح: https://demo/?config=<encoded>#/
 *
 * الديمو بيفك الـ param ده في active-project.util.ts (resolveActiveProject)
 * اللي بيتنادى من APP_INITIALIZER قبل ما أي component يترسم.
 *
 * ⚠️  قيود مؤقتة:
 *   - الـ URL param ده مؤقت (patch) — الحل الدائم هو POST/GET /api/configs/{id}
 *     في خطوات الـ Publish (13-16) اللي لسه متبنيتش.
 *   - logoSvg كبير جدًا (> 6000 char SVG) ممكن يتجاوز Nginx 8192-byte limit.
 *     اتعمل حماية: لو الـ URL أكبر من 7500 char، الـ logo بيتحذف تلقائيًا مع warning.
 *     نتائج الـ URL-length test (يونيو 2026):
 *       - كونفيج واقعي 3 domains + style كامل + logoSvg بسيط → ~3800 chars ✅
 *       - logoSvg كبير 3KB                                   → ~5400 chars ✅
 *       - Nginx default limit                                 → 8192 chars
 *
 * PATH: src/app/foundation/core/theme-builder/demo-launcher.service.ts
 */
@Injectable({ providedIn: 'root' })
export class DemoLauncherService {
  private readonly store = inject(ThemeConfigurationStore);
  private readonly branding = inject(BrandingService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly configBuilder = inject(ConfigBuilderService);
  private readonly platformId    = inject(PLATFORM_ID);

  /** BroadcastChannel للـ real-time sync مع الـ demo tab */
  private readonly channel: BroadcastChannel | null =
    isPlatformBrowser(this.platformId) &&
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      : null;

  constructor() {
    // ── Real-time sync: broadcast every state change (debounced 300ms) ──────
  /**
   * يفتح tab جديد للـ demo ويبعتله الكونفيج الحالي في الـ URL.
   * يرجع الـ URL اللي اتفتح (مفيد للـ testing وللـ "نسخ الرابط" مستقبلًا).
   */
  openDemo(): string {
    const url = this._buildDemoUrl();
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

  openDemo(): void {
    // ── 1. بيانات الـ branding من BrandingService ──────────────────────────
    const appName = this.branding.appName();
    const themeColor = this.branding.themeColor();
    const logoSvg = this.branding.logo() ?? undefined;
      window.open(url, '_blank');
    }
    return url;
  }

  /**
   * يبني رابط الديمو بدون ما يفتحه — مفيد لو عايز تعرض الرابط أو تنسخه.
   */
  buildDemoUrl(): string {
    return this._buildDemoUrl();
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private _buildDemoUrl(): string {
    const config  = this.configBuilder.toJSON();
    const encoded = this._encodeConfig(config);
    const url     = `${DEMO_URL}?config=${encoded}`;

    // projectName: يأخذ العربي لو موجود، وإلا الإنجليزي، وإلا fallback
    const projectName = appName?.['ar'] || appName?.['en'] || 'LearnHub LMS';
    const websiteTitle = `${projectName} — منصة التعلم الإلكتروني`;
    const primaryColor = themeColor || '#059669';

    // ── 2. بنبني الـ ProjectConfigInput ───────────────────────────────────
    const projectConfig = {
      id: 'lms',
      projectName,
      websiteTitle,
      primaryColor,
      ...(logoSvg ? { logoSvg } : {}),
      domains: LMS_DOMAINS
    };

    // ── 3. بنحفظ في localStorage (للـ initial load في الـ demo) ──────────
    try {
      localStorage.setItem(
        DEMO_PROJECT_CONFIG_KEY,
        JSON.stringify(projectConfig)
      );
      localStorage.setItem(
        DEMO_THEME_CONFIG_KEY,
        JSON.stringify(this.store.snapshot())
      );
    } catch {
      // quota exceeded — silently ignore
    }

    // ── 4. بنبعت على الـ BroadcastChannel فورًا ──────────────────────────
    try {
      this.channel?.postMessage({
        type: 'theme_update',
        payload: this.store.snapshot()
      });
    } catch {
      // channel not available — silently ignore
    }

    // ── 5. بنفتح الـ demo ─────────────────────────────────────────────────
    window.open(DEMO_URL, '_blank');
    // حماية من URL طويل جدًا: لو تجاوز 7500 char، احذف الـ logo وجرب تاني
    if (url.length > 7500 && config.logoSvg) {
      console.warn(
        `[DemoLauncher] URL طويل جدًا (${url.length} chars) — بيحذف logoSvg ويجرب تاني`,
        'الحل الدائم: Publish flow (خطوات 13-16)'
      );
      const { logoSvg, logoSvgDark, ...configWithoutLogo } = config;
      const encodedWithoutLogo = this._encodeConfig(configWithoutLogo);
      return `${DEMO_URL}?config=${encodedWithoutLogo}`;
    }

    return url;
  }

  /**
   * JSON → base64 → URL-safe string
   * الخوارزمية: JSON.stringify → encodeURIComponent → escape → btoa → encodeURIComponent
   * (نفس الخوارزمية اللي بيفكها atob + decodeURIComponent في جانب الديمو)
   */
  private _encodeConfig(config: Partial<ProjectConfigInput>): string {
    const json = JSON.stringify(config);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  }
}
