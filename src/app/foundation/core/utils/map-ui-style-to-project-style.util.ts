/**
 * ── UIStyleConfig → ProjectStyleConfig mapper (pure, framework-agnostic) ─────
 * اتنقلت هنا من demo-launcher.service.ts (يونيو 2026) بعد ما بقى ليها
 * استهلاكين: DemoLauncherService (لبناء معاينة الـ demo) و UIStyleDesignerService
 * (اللي بيغذّي ConfigBuilderService تلقائيًا — Step 9). مكانها هنا في
 * foundation/core/utils/ نفس مكان group-modules-into-domains.util.ts.
 *
 * بتحوّل UIStyleConfig (شكل شاشة الـ designer: tables/sidebars/cards/dialogs/
 * shapes) لـ ProjectStyleConfig (شكل الـ YAML/ProjectConfigInput) بوضع كل
 * component config في حقل `advanced` المناسب.
 *
 * قرار مُتخذ (مش نقص — موثّق سابقًا في project-config.model.ts/generated.ts):
 * 'shapes' مفيهوش مكان مخصص في ProjectStyleConfig حاليًا فبيتسيب. 'topbar' و
 * 'button' و 'login' مش من ضمن ComponentKey بتاعة شاشة الـ designer أصلًا
 * (tables | sidebars | cards | dialogs | shapes بس)، فبيفضلوا undefined —
 * مش بيانات ناقصة، الشاشة دي معندهاش UI ليهم لسه.
 *
 * عمدًا: مفيش fallback هنا (زي groupModulesIntoDomains) — التحويل ده دايمًا
 * deterministic 1:1 مفيش حالة "فاضي"، فمفيش حاجة لاستهلاك يضيف فوقها بعدين.
 */
import type { UIStyleConfig } from '@/app/foundation/core/ui-style-designer/ui-style-designer.model';
import type { ProjectStyleConfig } from '@/app/foundation/core/models/project-config.generated';

export function mapUiStyleConfigToProjectStyle(cfg: UIStyleConfig): ProjectStyleConfig {
  return {
    table: { advanced: cfg.tables },
    dialog: { advanced: cfg.dialogs },
    card: { advanced: cfg.cards },
    sidebar: { advanced: cfg.sidebars }
  };
}
