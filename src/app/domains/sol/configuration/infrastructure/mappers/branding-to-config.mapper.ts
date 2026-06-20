/**
 * ── Branding → ProjectConfigInput mapper ──────────────────────────────────────
 * BrandingConfig (شاشة الويزارد الحالية) أغنى بكتير من حقول Branding في
 * ProjectConfigInput: فيها لغات متعددة (LocalizedText) ولوجو ممكن يكون أي صيغة
 * صورة، أما ProjectConfigInput عايز string واحد وSVG خام بس. المابر ده بيعمل
 * أفضل تحويل ممكن، وبيرجّع `warnings` صريحة لأي حاجة اتفقدت في التحويل — مش
 * بيغطي على المشكلة، بيقولها بصوت عالي.
 *
 * ملحوظتين مهمتين متعمدتين (مش نواقص اتنستيت):
 *  1) `id` و `isDefault` مالهومش مصدر في BrandingConfig خالص — المابر مايرجعهمش،
 *     يعني ConfigBuilderService.updateBranding() (partial patch) مش هيلمسهم.
 *     لازم يتحددوا من حتة تانية (مثلاً شاشة "مشروع جديد" اللي بتسمي المشروع).
 *  2) لو اللوجو/الفافيكون المرفوع PNG/JPG (مش SVG)، بيتسيب فاضي في الناتج —
 *     مش بيتحط غلط في logoSvg، عشان كده الـ warning موجودة.
 */
import type { ProjectConfigInput } from '@/app/foundation/core/models/project-config.generated';
import type { LocalizedText } from '@/app/domains/sol/configuration/infrastructure/branding.service';

export interface BrandingSourceForMapping {
  appName: LocalizedText;
  metaTitle: LocalizedText;
  themeColor: string;
  logo: string | null;
  favicon: string | null;
  /** اللغات اللي التطبيق شغال بيها — أول لغة هنا هي "اللغة الأساسية" للتحويل */
  languages: string[];
}

export type MappableBrandingFields = Partial<
  Pick<ProjectConfigInput, 'projectName' | 'websiteTitle' | 'primaryColor' | 'logoSvg' | 'faviconSvg'>
>;

export interface BrandingMappingResult {
  fields: MappableBrandingFields;
  warnings: string[];
}

/** بياخد أول قيمة موجودة فعليًا: اللغة الأساسية، بعدين en، بعدين أي لغة تانية فيها نص */
function pickPrimaryText(value: LocalizedText, languages: string[]): string {
  for (const code of languages) {
    const v = value[code];
    if (v) return v;
  }
  if (value['en']) return value['en']!;
  const firstNonEmpty = Object.values(value).find((v) => !!v);
  return firstNonEmpty ?? '';
}

/** بيقبل بس لو فعليًا SVG (data URL أو raw markup) — أي صيغة تانية بترفض بصمت هنا، والـ caller بيتبلغ */
function asSvgOnly(value: string | null): string | undefined {
  if (!value) return undefined;
  const isSvgDataUrl = /^data:image\/svg\+xml/i.test(value);
  const isRawSvgMarkup = /^\s*<svg[\s>]/i.test(value);
  return isSvgDataUrl || isRawSvgMarkup ? value : undefined;
}

export function mapBrandingToProjectFields(source: BrandingSourceForMapping): BrandingMappingResult {
  const warnings: string[] = [];

  const projectName = pickPrimaryText(source.appName, source.languages);
  const websiteTitle = pickPrimaryText(source.metaTitle, source.languages) || projectName;

  const logoSvg = asSvgOnly(source.logo);
  if (source.logo && !logoSvg) {
    warnings.push('اللوجو المرفوع في شاشة Branding مش SVG (غالبًا PNG/JPG) — اتسيب فاضي في logoSvg لحد ما يترفع SVG.');
  }

  const faviconSvg = asSvgOnly(source.favicon);
  if (source.favicon && !faviconSvg) {
    warnings.push('الفافيكون المرفوع مش SVG — اتسيب فاضي في faviconSvg لنفس السبب.');
  }

  const fields: MappableBrandingFields = {
    projectName,
    websiteTitle,
    primaryColor: source.themeColor,
    ...(logoSvg ? { logoSvg } : {}),
    ...(faviconSvg ? { faviconSvg } : {})
  };

  return { fields, warnings };
}
