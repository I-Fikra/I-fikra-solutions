import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeConfigurationStore } from './theme-configuration.store';
import { BrandingService } from '@/app/domains/sol/configuration/infrastructure/branding.service';

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

@Injectable({ providedIn: 'root' })
export class DemoLauncherService {
  private readonly store = inject(ThemeConfigurationStore);
  private readonly branding = inject(BrandingService);
  private readonly platformId = inject(PLATFORM_ID);

  /** BroadcastChannel للـ real-time sync مع الـ demo tab */
  private readonly channel: BroadcastChannel | null =
    isPlatformBrowser(this.platformId) &&
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      : null;

  constructor() {
    // ── Real-time sync: broadcast every state change (debounced 300ms) ──────
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
  }
}
