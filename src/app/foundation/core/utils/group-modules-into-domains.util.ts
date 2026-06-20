/**
 * ── ConfigModule[] → ConfigInputDomain[] grouping (pure, framework-agnostic) ──
 * اتنقلت هنا من demo-launcher.service.ts (يونيو 2026) بعد ما بقى ليها استهلاكين:
 * DemoLauncherService (لبناء معاينة الـ demo) و ConfigDataService (اللي بيغذّي
 * ConfigBuilderService تلقائيًا — Step 8). مكانها هنا في foundation/core/utils/
 * (جنب validate-project-config.util.ts) لأنها بقت فعلًا "مشتركة" مش بس بالاسم.
 *
 * عمدًا: الدالة دي "تجميع" بس — مفيهاش أي fallback domains. لو محدش اختار
 * module، بترجع مصفوفة فاضية []. أي استهلاك عايز fallback (زي DemoLauncherService
 * اللي عايز يورّي بيانات تجريبية بدل شاشة فاضية) بيضيفه هو بعد النداء مباشرة —
 * مش جوه الدالة، عشان ConfigBuilderService (اللي محتاج يعكس الواقع بالظبط في
 * الـ JSON Preview) ميستقبلش بيانات وهمية وكأنها مُختارة فعلًا.
 *
 * قرار مُتخذ (مش نقص): ConfigSubOption (المصدر) معندوش حقل `path` خالص — هو
 * أصلًا بيوصف "جانب فرعي" من feature (زي verification flag أو نوع مستند)،
 * مش route قابل للتصفح. عشان ConfigInputSubModule.path مطلوب (مش اختياري)،
 * بيتبني path تركيبي `/{moduleKey}/{featureKey}/{subOptionKey}` — بيتبع نفس
 * منطق اشتقاق المسارات من الـ keys المستخدم بالفعل في apiUrl تحت. لو فيه مكان
 * تاني بيعرّف paths حقيقية لاحقًا، الأولوية له مش للـ placeholder ده.
 */
import type { ConfigModule, ConfigFeature } from '@/app/services/sol/configuration/infrastructure/config-data.service';
import type {
  ConfigInputDomain,
  ConfigInputModule,
  ConfigInputSubModule
} from '@/app/foundation/core/models/project-config.generated';

/** بيحوّل features المفعّلة (enabled) في الـ module لـ subModules — لو الـ feature معندوش subOptions مختارة، بترجع undefined (مش [] فاضية) عشان يتسيب الحقل غائب زي باقي الكونفنشن في الموديل. */
function mapFeaturesToSubModules(moduleKey: string, features: ConfigFeature[]): ConfigInputSubModule[] | undefined {
  const subModules: ConfigInputSubModule[] = [];

  for (const feature of features) {
    if (!feature.enabled) continue;

    const selectedKeys = (feature as unknown as { selectedSubOptions?: string[] }).selectedSubOptions ?? [];
    if (selectedKeys.length === 0) continue;

    const optionsByKey = new Map((feature.subOptions ?? []).map((opt) => [opt.key, opt]));

    for (const optKey of selectedKeys) {
      const opt = optionsByKey.get(optKey);
      if (!opt) continue; // مفتاح مش موجود فعليًا في الكتالوج — يتجاهل بصمت بدل ما يطلع subModule ناقص بيانات
      subModules.push({
        id: opt.key,
        label: opt.label,
        icon: opt.icon,
        path: `/${moduleKey}/${feature.key}/${opt.key}`
      });
    }
  }

  return subModules.length ? subModules : undefined;
}

/**
 * بيجمّع ConfigModule[] (المختارة من شاشة الـ Domains) حسب حقل `domain` بتاعها
 * لـ ConfigInputDomain[]. مفيش fallback هنا — مصفوفة فاضية لو مفيش modules
 * متاختارة. كل استهلاك بيقرر هو احتياجه للـ fallback أو لأ.
 */
export function groupModulesIntoDomains(modules: ConfigModule[]): ConfigInputDomain[] {
  const selected = modules.filter((m) => m.selected);
  if (selected.length === 0) return [];

  const domainMap = new Map<string, ConfigInputDomain>();

  for (const mod of selected) {
    const domainId = mod.domain ?? mod.key;
    if (!domainMap.has(domainId)) {
      domainMap.set(domainId, {
        id: domainId,
        label: domainId.charAt(0).toUpperCase() + domainId.slice(1),
        modules: []
      });
    }

    const subModules = mapFeaturesToSubModules(mod.key, mod.features);

    const inputModule: ConfigInputModule = {
      id: mod.key,
      label: mod.label,
      icon: mod.icon,
      // مسار افتراضي للـ JSON بناءً على اسم الـ module — نفس الكونفنشن المستخدم
      // قبل كده في demo-launcher.service.ts (مش بيانات حقيقية، placeholder).
      apiUrl: `/api/${mod.key}-ar.json`,
      fallbackJsonAr: `/api/${mod.key}-ar.json`,
      fallbackJsonEn: `/api/${mod.key}-en.json`,
      idField: 'id',
      actions: { create: true, edit: true, view: true, delete: true },
      ...(subModules ? { subModules } : {})
    };

    domainMap.get(domainId)!.modules.push(inputModule);
  }

  return Array.from(domainMap.values());
}
