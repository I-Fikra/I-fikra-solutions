/**
 * ── Schema Validation (pure, framework-agnostic) ──────────────────────────────
 * دالة واحدة بسيطة: تاخد الـ schema (parsed JSON) وبيانات الكونفيج، وترجع نتيجة
 * تحقق واضحة. متعمد إنها مش Angular service وميهاش أي dependency غير ajv، عشان:
 *   1) تتقدر تتستخدم جوه الـ Angular app (عن طريق ConfigValidatorService).
 *   2) تتقدر تتستخدم في سكريبت Node (CI / pre-publish check) بدون Angular خالص.
 *   3) تتتست بسهولة بدون TestBed.
 *
 * الـ schema نفسه مصدره الوحيد: public/schemas/project-config.schema.json
 * (نفس الملف اللي بيتقرأ وقت الـ build لتوليد project-config.generated.ts).
 */
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';

export interface ValidationResult {
  valid: boolean;
  /** رسائل بشرية جاهزة للعرض، سطر لكل خطأ */
  errors: string[];
  /** الأخطاء الخام من ajv، لو احتجت تفاصيل أكتر (path, keyword...) */
  rawErrors: ErrorObject[] | null;
}

// كاش بسيط: نفس الـ schema بيتجمّع (compile) مرة واحدة بس، مش كل نداء.
const compiledValidators = new WeakMap<object, ValidateFunction>();

export function validateAgainstSchema(schema: object, data: unknown): ValidationResult {
  let validateFn = compiledValidators.get(schema);

  if (!validateFn) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    validateFn = ajv.compile(schema);
    compiledValidators.set(schema, validateFn);
  }

  const valid = validateFn(data) as boolean;

  if (valid) {
    return { valid: true, errors: [], rawErrors: null };
  }

  const rawErrors = validateFn.errors ?? [];
  const errors = rawErrors.map(formatError);

  return { valid: false, errors, rawErrors };
}

/** يحوّل خطأ ajv الخام لرسالة عربي/إنجليزي بسيطة وواضحة بدل الـ JSON الخام */
function formatError(err: ErrorObject): string {
  const path = err.instancePath ? err.instancePath.replace(/^\//, '').replace(/\//g, '.') : '(root)';

  switch (err.keyword) {
    case 'required':
      return `الحقل "${(err.params as { missingProperty?: string }).missingProperty}" مطلوب وغير موجود في "${path || 'root'}"`;
    case 'enum':
      return `القيمة في "${path}" غير مسموحة. القيم المتاحة: ${(err.params as { allowedValues?: unknown[] }).allowedValues?.join(', ')}`;
    case 'type':
      return `الحقل "${path}" نوعه غلط: المتوقع ${(err.params as { type?: string }).type}`;
    case 'additionalProperties':
      return `حقل غير معروف "${(err.params as { additionalProperty?: string }).additionalProperty}" في "${path || 'root'}"`;
    default:
      return `${path}: ${err.message ?? 'خطأ غير معروف'}`;
  }
}
