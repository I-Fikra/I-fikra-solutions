/**
 * ── active-project.util.ts (Demo App — جانب الديمو) ─────────────────────────
 *
 * يحدد "ما هو المشروع النشط؟" من خلال قراءة الـ URL params بترتيب الأولوية:
 *
 *   1. ?config=<base64>  ← الـ wizard بيبعت الكونفيج كامل encode في الرابط
 *      (الآلية المؤقتة دلوقتي — تشتغل cross-origin بدون backend)
 *
 *   2. ?project=<id>     ← الـ Publish flow النهائي (خطوات 13-16 في الويزارد)
 *      بيبعت id بس والديمو بيجيب الكونفيج من GET /api/configs/{id}
 *
 *   3. localStorage['demo_project_config']  ← same-origin dev mode فقط
 *      (مش بيشتغل cross-domain — فقط كـ fallback في local development)
 *
 * ملاحظة: الراوتينج في الديمو `withHashLocation` — يعني الـ URL شكله:
 *   https://demo/#/some/route?config=... ← ده مش بيشتغل
 *   https://demo/?config=...#/some/route ← ده الصح
 *
 * زرار الديمو في الويزارد بيبني الرابط بالشكل الصح (param قبل الـ hash).
 *
 * ⚠️  الـ ?config= param مؤقت — لو الكونفيج كبير (لوجو SVG معقد + domains كتير)،
 *     الـ URL ممكن يتجاوز حد السيرفر (Nginx: ~8192 bytes). الحل الدائم:
 *     POST /api/configs/{id} في الويزارد + GET /api/configs/{id} في الديمو
 *     (خطوات 13-16 في الـ wizard side).
 *
 * PATH في الديمو: src/app/foundation/core/utils/active-project.util.ts
 *   (أو أي مسار يناسب معماريتك — المهم يتنادى من APP_INITIALIZER)
 */

import type { ProjectConfigInput } from '../models/project-config.generated';
// إذا لم يكن الـ generated model موجودًا في الديمو بعد، اولّده بنفس السكريبت:
//   npm run generate:types
// من نفس ملف schemas/project-config.schema.json المنسوخ من الويزارد.

export interface ActiveProjectResult {
  /** الكونفيج المحلول — جاهز لتمريره لـ applyInputConfig() */
  config: ProjectConfigInput | null;
  /** من أين جاء الكونفيج — للـ logging وللـ debug */
  source: 'url-param' | 'project-id' | 'local-storage' | 'none';
  /** الـ project id لو كان ?project= موجود (للـ Publish flow) */
  projectId: string | null;
}

/**
 * يقرأ الـ search params من الـ URL الحالي.
 *
 * مراعاة withHashLocation: `window.location.search` (قبل الـ #) — مش من
 * داخل الـ hash — هو المكان الصح. الرابط المتوقع:
 *   https://demo/?config=XYZ#/dashboard
 * وليس:
 *   https://demo/#/dashboard?config=XYZ  ← ده مش بيشتغل مع window.location.search
 */
function getUrlSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * يفك تشفير الـ base64 config param ويعيد الـ object.
 * لو فيه أي خطأ في الـ decoding أو الـ parsing، بيرجع null.
 *
 * الخوارزمية العكسية لـ encodeURIComponent(btoa(unescape(encodeURIComponent(json)))):
 *   decodeURIComponent(param) → atob → decodeURIComponent → JSON.parse
 *
 * (decodeURIComponent الأول بتعمله `new URLSearchParams` تلقائيًا،
 *  لذلك بنبدأ مباشرة من atob)
 */
function decodeConfigParam(encoded: string): ProjectConfigInput | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    // تحقق أولي: لازم يكون object فيه id و domains
    if (typeof parsed !== 'object' || !parsed || !parsed.id || !Array.isArray(parsed.domains)) {
      console.warn('[ActiveProject] ?config param موجود لكن شكله غلط — متجاهَل');
      return null;
    }
    return parsed as ProjectConfigInput;
  } catch (e) {
    console.warn('[ActiveProject] فشل فك تشفير ?config param:', e);
    return null;
  }
}

/**
 * يحاول يجيب الكونفيج من localStorage (same-origin dev mode فقط).
 * مش بيشتغل cross-domain — هنا كـ fallback بس.
 */
function getConfigFromLocalStorage(): ProjectConfigInput | null {
  try {
    const raw = localStorage.getItem('demo_project_config');
    if (!raw) return null;
    return JSON.parse(raw) as ProjectConfigInput;
  } catch {
    return null;
  }
}

/**
 * الدالة الرئيسية — تتنادى من APP_INITIALIZER (أو من ConfigFetchService).
 *
 * استخدام:
 * ```ts
 * const result = resolveActiveProject();
 * if (result.source === 'url-param') {
 *   projectConfigService.applyInputConfig(result.config!);
 * } else if (result.source === 'project-id') {
 *   // جيب الكونفيج من الـ backend: GET /api/configs/{result.projectId}
 *   // ثم: projectConfigService.applyInputConfig(fetched);
 * }
 * ```
 */
export function resolveActiveProject(): ActiveProjectResult {
  const params = getUrlSearchParams();

  // ── الأولوية 1: ?config=<base64> ─────────────────────────────────────────
  const configParam = params.get('config');
  if (configParam) {
    const config = decodeConfigParam(configParam);
    if (config) {
      console.info(`[ActiveProject] ✅ كونفيج مشفّر في الـ URL — projectName: "${config.projectName}"`);
      return { config, source: 'url-param', projectId: null };
    }
    // فشل الـ decode — كمّل للـ fallback التالي بدل ما توقف
  }

  // ── الأولوية 2: ?project=<id> (Publish flow — خطوات 13-16) ───────────────
  const projectId = params.get('project');
  if (projectId) {
    console.info(`[ActiveProject] 🔗 project id في الـ URL: "${projectId}" — محتاج fetch من الـ backend`);
    return { config: null, source: 'project-id', projectId };
  }

  // ── الأولوية 3: localStorage (same-origin dev mode) ──────────────────────
  const lsConfig = getConfigFromLocalStorage();
  if (lsConfig) {
    console.info(`[ActiveProject] 📦 كونفيج من localStorage (dev mode) — projectName: "${lsConfig.projectName}"`);
    return { config: lsConfig, source: 'local-storage', projectId: null };
  }

  // ── مفيش حاجة — الديمو هيشتغل بالكونفيج الـ default بتاعه ──────────────
  console.info('[ActiveProject] ℹ️ مفيش config param أو project id — شغّل الـ default');
  return { config: null, source: 'none', projectId: null };
}
