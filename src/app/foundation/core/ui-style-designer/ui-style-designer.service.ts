import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemePersonalityService } from '@/app/foundation/core/theme-builder/theme-personality.service';
import { mapComponentStyleToPersonalityTokens } from '@/app/foundation/core/theme-builder/component-style-mapper';
import { ConfigBuilderService } from '@/app/foundation/core/services/config-builder.service';
import { mapUiStyleConfigToProjectStyle } from '@/app/foundation/core/utils/map-ui-style-to-project-style.util';
import {
  ComponentKey,
  ComponentStyleConfig,
  SubElementKey,
  SubElementStyle,
  UIStyleConfig,
  DEFAULT_UI_STYLE_CONFIG,
  DEFAULT_COMPONENT_STYLE,
  COMPONENT_KEYS,
} from './ui-style-designer.model';

const STORAGE_KEY = 'ui-style-designer-config';

@Injectable({ providedIn: 'root' })
export class UIStyleDesignerService {
  private readonly platformId    = inject(PLATFORM_ID);
  private readonly personalitySvc = inject(ThemePersonalityService);
  private readonly configBuilder  = inject(ConfigBuilderService);

  readonly config = signal<UIStyleConfig>(this._load());

  /**
   * ── ربط بـ ConfigBuilderService (Step 9) ───────────────────────────────────
   * نفس باترن BrandingService (Step 7) و ConfigDataService (Step 8): effect()
   * في الـ constructor بيراقب config() وبينادي ConfigBuilderService.setStyle()
   * تلقائيًا مع كل patchComponent()/patchSubElement()/reset()/resetAll() —
   * صفر تعديل مطلوب في ui-style-designer.component.ts. بيستخدم
   * mapUiStyleConfigToProjectStyle المشتركة (foundation/core/utils).
   *
   * ملحوظة: بخلاف Step 7/8، هنا مفيش "حالة فاضية" حقيقية — config() دايمًا
   * عنده الـ 5 component keys بقيمهم الافتراضية من DEFAULT_UI_STYLE_CONFIG من
   * أول إنشاء للسيرفس (مش من أول تحميل للأبلكيشن — UIStyleDesignerService زي
   * أي `providedIn: 'root'` تاني بيتعمله instantiate كسول (lazy) أول مرة حد
   * يحقنه فعليًا، يعني شاشة "UI Style" أو DemoLauncherService). من لحظة ما
   * السيرفس بيتعمله instantiate، ConfigBuilderService.config().style هيتملي
   * بالقيم الافتراضية حتى لو اليوزر لسه ما لمسش حاجة — ده سلوك صحيح ومتوقع
   * (الافتراضي نفسه "قيمة صالحة")، مش bug.
   */
  private readonly _syncStyleToConfigBuilder = effect(() => {
    const style = mapUiStyleConfigToProjectStyle(this.config());
    this.configBuilder.setStyle(style);
  });

  readonly hasChanges = computed(() =>
    JSON.stringify(this.config()) !== JSON.stringify(DEFAULT_UI_STYLE_CONFIG)
  );

  // ── Per-component update (draft — يشتغل قبل save) ────────────────────────
  // patchComponent و patchSubElement فاضلين local لحد ما اليوزر يدوس Apply/Save.
  // بيطبقوا --usd-* vars مؤقتة للـ live preview جوا شاشة الـ designer بس.

  patchComponent(key: ComponentKey, patch: Partial<ComponentStyleConfig>): void {
    this.config.update(cfg => ({
      ...cfg,
      [key]: { ...cfg[key], ...patch },
    }));
    this._applyCssVars(key);
  }

  patchSubElement(
    compKey: ComponentKey,
    subKey: SubElementKey,
    patch: Partial<SubElementStyle>
  ): void {
    const current  = this.config()[compKey].subElements ?? {};
    const existing = current[subKey] ?? {};
    const updated: SubElementStyle = { ...existing, ...patch } as SubElementStyle;
    this.patchComponent(compKey, {
      subElements: { ...current, [subKey]: updated },
    });
  }

  // ── Save / Reset ──────────────────────────────────────────────────────────

  save(): void {
    // احتفظ بـ draft في localStorage كـ optional backup (مش المصدر الأساسي)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config()));
    }
    // طبّق كل component — _applyCssVars للـ --usd-* + _applyMappedTokens للـ --app-*
    for (const key of COMPONENT_KEYS) {
      this._applyCssVars(key);
      this._applyMappedTokens(key);
    }
  }

  applyGlobal(): void {
    this.save();
  }

  reset(key: ComponentKey): void {
    this.patchComponent(key, { ...DEFAULT_COMPONENT_STYLE, subElements: {} });
    // امسح الـ tokens اللي طبّقناها لهذا الـ component
    this._applyMappedTokens(key);
  }

  resetAll(): void {
    this.config.set(JSON.parse(JSON.stringify(DEFAULT_UI_STYLE_CONFIG)));
    for (const k of COMPONENT_KEYS) {
      this._applyCssVars(k);
      this._applyMappedTokens(k);
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // ── CSS variable application ──────────────────────────────────────────────

  /**
   * --usd-{key}-* vars: بتُستخدم جوا شاشة الـ designer نفسها للـ live preview.
   * فاضلة موجودة لأنها مش بتأثر على باقي الكومبوننتس في الأبلكيشن.
   */
  private _applyCssVars(key: ComponentKey): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const cfg  = this.config()[key];
    const root = document.documentElement;
    const p    = `--usd-${key}`;

    root.style.setProperty(`${p}-radius`,       `${cfg.cornerRadius}px`);
    root.style.setProperty(`${p}-shadow`,        cfg.elevationShadow ? '0 4px 16px rgba(0,0,0,0.18)' : 'none');
    root.style.setProperty(`${p}-padding`,       `${cfg.internalPadding}px`);
    root.style.setProperty(`${p}-margin`,        `${cfg.externalMargin}px`);
    root.style.setProperty(`${p}-border-width`,  cfg.border ? `${cfg.borderWidth}px` : '0px');
    root.style.setProperty(`${p}-border-color`,  cfg.borderColor);
    root.style.setProperty(`${p}-font-family`,   cfg.fontFamily);
    root.style.setProperty(`${p}-font-weight`,
      cfg.fontWeight === 'Bold' ? '700' : cfg.fontWeight === 'Medium' ? '500' : '400');
  }

  /**
   * --app-* vars + PersonalityTokens: بتطبّق التغييرات على الكومبوننتس الحقيقية
   * في الأبلكيشن عن طريق ThemePersonalityService.applyPersonality() (global على root)
   * + setProperty يدوي للـ extraVars (margin/width/border للـ tables والـ sidebars).
   *
   * بتتنادى بس من save() / reset() — مش من كل patch — عشان التطبيق الحقيقي
   * يحصل بس لما اليوزر يدوس "Apply" مش في كل تغيير مؤقت.
   */
  private _applyMappedTokens(key: ComponentKey): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const cfg = this.config()[key];
    const { tokens, extraVars } = mapComponentStyleToPersonalityTokens(key, cfg);

    // tokens → ThemePersonalityService (بيكتب على document.documentElement)
    this.personalitySvc.applyPersonality(tokens);

    // extraVars → setProperty يدوي (margin, width, border للـ tables/sidebars/shapes)
    const root = document.documentElement;
    for (const [varName, value] of Object.entries(extraVars)) {
      root.style.setProperty(varName, value);
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _load(): UIStyleConfig {
    if (!isPlatformBrowser(this.platformId)) {
      return JSON.parse(JSON.stringify(DEFAULT_UI_STYLE_CONFIG));
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UIStyleConfig;
        const merged: UIStyleConfig = {} as UIStyleConfig;
        for (const k of COMPONENT_KEYS) {
          merged[k] = {
            ...DEFAULT_COMPONENT_STYLE,
            ...(parsed[k] ?? {}),
            subElements: (parsed[k] as any)?.subElements ?? {},
          };
        }
        return merged;
      }
    } catch { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_UI_STYLE_CONFIG));
  }
}