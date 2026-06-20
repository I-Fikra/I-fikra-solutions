/**
 * ── PublishService (Step 13) ───────────────────────────────────────────────────
 *
 * مسؤول عن خطوة واحدة بس: نشر الكونفيج على الـ backend.
 *
 * الـ endpoint المتوقع:
 *   POST /api/configs          → ينشئ كونفيج جديد، يرجع { id, previewUrl }
 *   PUT  /api/configs/{id}     → يحدّث كونفيج موجود (لو نفس الـ id اتنشر قبل)
 *
 * الـ response shape المتوقعة من الـ backend:
 *   { id: string; previewUrl: string }
 *   حيث previewUrl = `https://demo-app/?project={id}`
 *
 * ملحوظة: الـ backend endpoint ده لسه مش مبني — الـ service ده جاهز من جانب
 * الويزارد. لو الـ endpoint مش موجود (404/network error)، الـ publish$ بيرجع
 * PublishError واضح بدل ما يـ crash الأبليكيشن.
 *
 * single responsibility: مش بيعمل validate، مش بيفتح demo — بس POST/PUT.
 * الـ validate في ConfigValidatorService، والـ demo في DemoLauncherService.
 *
 * PATH: src/app/foundation/core/services/publish.service.ts
 */
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import type { ProjectConfigInput } from '@/app/foundation/core/models/project-config.generated';
import { environment } from '@/environments/environment';

// ── Response / Error types ────────────────────────────────────────────────────

export interface PublishResult {
  /** معرّف المشروع على الـ backend (نفس config.id لو الـ backend بيحتفظ بيه) */
  id: string;
  /** رابط المعاينة الكامل — جاهز يتعرض للعميل */
  previewUrl: string;
}

export interface PublishError {
  /** رسالة واضحة للعرض في الـ UI */
  message: string;
  /** HTTP status code لو الخطأ من السيرفر، null لو network error */
  statusCode: number | null;
}

// ── Backend envelope ──────────────────────────────────────────────────────────

interface PublishApiResponse {
  id: string;
  previewUrl?: string;
  preview_url?: string; // بعض الـ backends بيبعتوا snake_case
}

@Injectable({ providedIn: 'root' })
export class PublishService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/configs`;

  /**
   * ينشر الكونفيج على الـ backend.
   *
   * - لو `config.id` موجود وسبق نشره → PUT /api/configs/{id} (update)
   * - لو `config.id` جديد أو ما اتنشرش قبل → POST /api/configs (create)
   *
   * بيرجع Observable<PublishResult> عند النجاح،
   * أو Observable<never> بيـ throw PublishError عند الفشل.
   *
   * استخدام:
   * ```ts
   * publishService.publish(configBuilder.toJSON()).subscribe({
   *   next: (result) => console.log('رابط المعاينة:', result.previewUrl),
   *   error: (err: PublishError) => console.error(err.message),
   * });
   * ```
   */
  publish(config: ProjectConfigInput): Observable<PublishResult> {
    const request$ = this._publishedIds.has(config.id)
      ? this.http.put<PublishApiResponse>(`${this.baseUrl}/${config.id}`, config)
      : this.http.post<PublishApiResponse>(this.baseUrl, config);

    return request$.pipe(
      map((res) => {
        const result = this._mapResponse(res, config.id);
        // احفظ الـ id كـ "منشور" عشان المرة الجاية تعمل PUT مش POST
        this._publishedIds.add(config.id);
        return result;
      }),
      catchError((err) => throwError(() => this._mapError(err)))
    );
  }

  /**
   * لو عايز تـ force إعادة النشر كـ POST بدل PUT (مثلًا بعد reset):
   * ```ts
   * publishService.forgetPublished(config.id);
   * ```
   */
  forgetPublished(id: string): void {
    this._publishedIds.delete(id);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * كاش in-memory للـ ids اللي اتنشرت في نفس الـ session —
   * بيخلي الـ publish التاني يعمل PUT بدل POST تلقائيًا.
   * بيتمسح لو الصفحة اتـ refresh (متعمد — الـ backend هو المصدر الحقيقي).
   */
  private readonly _publishedIds = new Set<string>();

  private _mapResponse(res: PublishApiResponse, fallbackId: string): PublishResult {
    const id = res.id ?? fallbackId;
    // دعم camelCase و snake_case في نفس الوقت
    const previewUrl = res.previewUrl ?? res.preview_url
      ?? `https://platform-demo-chi.vercel.app/?project=${id}`;
    return { id, previewUrl };
  }

  private _mapError(err: unknown): PublishError {
    if (err instanceof HttpErrorResponse) {
      // خطأ من السيرفر — خد الرسالة من الـ body لو موجودة
      const body = err.error as Record<string, unknown> | null;
      const serverMsg =
        (typeof body?.['message'] === 'string' ? body['message'] : null) ??
        (typeof body?.['error']   === 'string' ? body['error']   : null);

      if (err.status === 0) {
        return { message: 'تعذّر الاتصال بالـ backend — تأكد من إن السيرفر شغّال', statusCode: null };
      }
      if (err.status === 404) {
        return { message: 'الـ endpoint غير موجود — تأكد من إن /api/configs متاح على الـ backend', statusCode: 404 };
      }
      if (err.status === 409) {
        return { message: serverMsg ?? 'المشروع ده موجود بالفعل بنفس الـ id — جرّب تغيّر الـ id أو استخدم update', statusCode: 409 };
      }
      return {
        message: serverMsg ?? `خطأ من السيرفر (${err.status})`,
        statusCode: err.status,
      };
    }
    // network error أو خطأ غير متوقع
    return { message: 'حدث خطأ غير متوقع أثناء النشر', statusCode: null };
  }
}
