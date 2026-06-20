/**
 * ── ConfigBuilderService ───────────────────────────────────────────────────────
 * مكان واحد بس يحتفظ بشكل الكونفيج الكامل اللي هيتنشر في الآخر (ProjectConfigInput).
 * كل شاشة في الويزارد (Branding / Domains / Colors / Style) تقرأ وتكتب هنا بدل
 * ما يكون لها state منفصل — وده اللي يضمن إن المعاينة (JSON Preview) والنشر
 * (Publish) شايفين نفس البيانات بالضبط، مهما الشاشات اللي عدلوا فيها.
 *
 * ملحوظة مهمة: الـ types هنا مستوردة من project-config.generated.ts (الملف
 * المولّد من الـ schema)، مش من project-config.model.ts القديم — ده استخدام
 * فعلي للملف المولّد، خطوة في طريق الاستغناء عن الموديل اليدوي القديم بالكامل.
 *
 * عمدًا: السيرفس ده مالوش أي علاقة بالـ validation أو النشر (single responsibility)
 * — هو بس "مكان تخزين". الـ validate() والـ publish() هيتبنوا فوقه في خطوات جاية.
 */
import { computed, Injectable, signal } from '@angular/core';
import type {
  ProjectConfigInput,
  ConfigInputDomain,
  ProjectColorConfig,
  ProjectStyleConfig
} from '@/app/foundation/core/models/project-config.generated';

/** قيمة افتراضية تمثل "مشروع جديد فاضي" — كل الحقول المطلوبة موجودة بقيم خام */
export const DEFAULT_PROJECT_CONFIG: ProjectConfigInput = {
  id: '',
  projectName: '',
  websiteTitle: '',
  primaryColor: '#6366F1',
  domains: []
};

@Injectable({ providedIn: 'root' })
export class ConfigBuilderService {
  private readonly _config = signal<ProjectConfigInput>(structuredClone(DEFAULT_PROJECT_CONFIG));

  /** القراءة فقط من برّه — أي تعديل لازم يعدي من الدوال تحت */
  readonly config = this._config.asReadonly();

  /** بيستخدمها أي شاشة عايزة تعرف هل فيه domains متضافة قبل كده ولا لسه فاضي */
  readonly isEmpty = computed(() => this._config().domains.length === 0);

  // ── Branding (شاشة Branding) ────────────────────────────────────────────────
  updateBranding(patch: Partial<Pick<ProjectConfigInput,
    'id' | 'projectName' | 'websiteTitle' | 'primaryColor' | 'logoSvg' | 'logoSvgDark' | 'faviconSvg' | 'isDefault'
  >>): void {
    this._config.update((current) => ({ ...current, ...patch }));
  }

  // ── Colors (شاشة الألوان) ───────────────────────────────────────────────────
  setColors(colors: ProjectColorConfig | undefined): void {
    this._config.update((current) => ({ ...current, colors }));
  }

  // ── Style (شاشة UI Style Designer) ──────────────────────────────────────────
  setStyle(style: ProjectStyleConfig | undefined): void {
    this._config.update((current) => ({ ...current, style }));
  }

  // ── Domains (شاشة Configuration/Domains) ────────────────────────────────────
  setDomains(domains: ConfigInputDomain[]): void {
    this._config.update((current) => ({ ...current, domains }));
  }

  upsertDomain(domain: ConfigInputDomain): void {
    this._config.update((current) => {
      const exists = current.domains.some((d) => d.id === domain.id);
      const domains = exists
        ? current.domains.map((d) => (d.id === domain.id ? domain : d))
        : [...current.domains, domain];
      return { ...current, domains };
    });
  }

  removeDomain(domainId: string): void {
    this._config.update((current) => ({
      ...current,
      domains: current.domains.filter((d) => d.id !== domainId)
    }));
  }

  // ── عامة ─────────────────────────────────────────────────────────────────────
  /** بترجع نسخة (snapshot) من الكونفيج الحالي — مفيدة لـ JSON Preview و Publish */
  toJSON(): ProjectConfigInput {
    return structuredClone(this._config());
  }

  /** لو المستخدم عمل "مشروع جديد" أو بعد نشر ناجح وعايز يبدأ من الأول */
  reset(): void {
    this._config.set(structuredClone(DEFAULT_PROJECT_CONFIG));
  }
}
