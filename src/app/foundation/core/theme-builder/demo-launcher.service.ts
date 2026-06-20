import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfigBuilderService } from '@/app/foundation/core/services/config-builder.service';
import type { ProjectConfigInput } from '@/app/foundation/core/models/project-config.generated';

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
  private readonly configBuilder = inject(ConfigBuilderService);
  private readonly platformId    = inject(PLATFORM_ID);

  /**
   * يفتح tab جديد للـ demo ويبعتله الكونفيج الحالي في الـ URL.
   * يرجع الـ URL اللي اتفتح (مفيد للـ testing وللـ "نسخ الرابط" مستقبلًا).
   */
  openDemo(): string {
    const url = this._buildDemoUrl();
    if (isPlatformBrowser(this.platformId)) {
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
