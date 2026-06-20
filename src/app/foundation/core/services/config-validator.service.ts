/**
 * ── ConfigValidatorService ─────────────────────────────────────────────────────
 * بيجيب project-config.schema.json كـ asset عادي (زي public/api/*.json بالضبط)،
 * يكاشّه مرة واحدة، وبيوفّر دالة validate() بسيطة تستخدمها أي شاشة في الويزارد
 * قبل النشر (زي ما هو متخطط في خطوة "النشر" — validate() قبل publish()).
 *
 * ملحوظة مهمة: الملف اللي بيتجاب هنا هو *نفسه* اللي سكريبت `generate:types`
 * بيقرأه وقت الـ build (public/schemas/project-config.schema.json) — مفيش
 * نسختين، نفس الملف بالضبط بيتستخدم في الحالتين.
 */
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { validateAgainstSchema, ValidationResult } from '@/app/foundation/core/utils/validate-project-config.util';

@Injectable({ providedIn: 'root' })
export class ConfigValidatorService {
  private readonly http = inject(HttpClient);

  /** الـ schema بيتجاب مرة واحدة بس مهما اتنادت validate() كتير */
  private readonly schema$: Observable<object> = this.http
    .get<object>('/schemas/project-config.schema.json')
    .pipe(shareReplay(1));

  /**
   * يتحقق من أي object (مفروض يكون شكله ProjectConfigInput) ضد الـ schema.
   * استخدامها المتوقع: في شاشة الـ Configuration، قبل تفعيل زرار "نشر".
   */
  validate(config: unknown): Observable<ValidationResult> {
    return this.schema$.pipe(
      map((schema) => validateAgainstSchema(schema, config))
    );
  }
}
