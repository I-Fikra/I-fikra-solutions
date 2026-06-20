import { Component, signal, computed, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { Domains } from '@/app/domains/sol/configuration/presentation/domains/domains';
import { Branding } from '@/app/domains/sol/configuration/presentation/branding/branding';
import { UIStyleDesignerComponent } from '@/app/foundation/core/ui-style-designer/ui-style-designer.component';
import { ConfigBuilderService } from '@/app/foundation/core/services/config-builder.service';
import { ConfigValidatorService } from '@/app/foundation/core/services/config-validator.service';
import { DemoLauncherService } from '@/app/foundation/core/theme-builder/demo-launcher.service';
import {
  PublishService,
  PublishError
} from '@/app/foundation/core/services/publish.service';

// ── Section types ─────────────────────────────────────────────────────────────
type SectionKey = 'branding' | 'setup' | 'ui-style';

interface NavSection {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    ToastModule,
    ButtonModule,
    TooltipModule,
    Domains,
    Branding,
    UIStyleDesignerComponent
  ],
  templateUrl: './app-configuration.component.html',
  styleUrls: ['./app-configuration.component.scss'],
  providers: [MessageService]
})
export class AppConfigurationComponent {
  private readonly configBuilder = inject(ConfigBuilderService);
  private readonly configValidator = inject(ConfigValidatorService);
  private readonly demoLauncher = inject(DemoLauncherService);
  private readonly publishService = inject(PublishService);
  private readonly messageService = inject(MessageService);

  // ── Navigation ───────────────────────────────────────────────────────────────
  readonly navSections: NavSection[] = [
    {
      key: 'branding',
      label: 'Branding',
      icon: 'pi pi-image',
      description: 'Logo, name, metadata & social'
    },
    {
      key: 'setup',
      label: 'Project Setup',
      icon: 'pi pi-box',
      description: 'Domain & configuration'
    },
    {
      key: 'ui-style',
      label: 'UI Style',
      icon: 'pi pi-objects-column',
      description: 'Components style designer'
    }
  ];

  activeSection = signal<SectionKey>('branding');
  readonly doneSections = signal<Set<SectionKey>>(new Set());

  readonly activeIndex = computed(() =>
    this.navSections.findIndex((s) => s.key === this.activeSection())
  );
  readonly canGoNext = computed(
    () => this.activeIndex() < this.navSections.length - 1
  );
  readonly canGoPrev = computed(() => this.activeIndex() > 0);

  goNext(): void {
    const next = this.navSections[this.activeIndex() + 1];
    if (next) this.activeSection.set(next.key);
  }

  goPrev(): void {
    const prev = this.navSections[this.activeIndex() - 1];
    if (prev) this.activeSection.set(prev.key);
  }

  onBrandingSaved(): void {
    this.doneSections.update((s) => new Set([...s, 'branding']));
    this.goNext();
  }

  onUiStyleDone(): void {
    this.doneSections.update((s) => new Set([...s, 'ui-style']));
  }

  setSection(key: SectionKey): void {
    this.activeSection.set(key);
  }
  isSectionDone(key: SectionKey): boolean {
    return this.doneSections().has(key);
  }

  // ── Step 11: Validate + Step 10: Open Demo ───────────────────────────────────

  readonly canPreview = computed(() => {
    // const cfg = this.configBuilder.config();
    // return !!cfg.id && !!cfg.projectName;
    return true;
  });

  readonly validateState = signal<'idle' | 'validating' | 'valid' | 'invalid'>(
    'idle'
  );
  readonly validationErrors = signal<string[]>([]);

  openDemoPreview(): void {
    if (!this.canPreview()) return;

    // this.validateState.set('validating');
    // this.validationErrors.set([]);

    // this.configValidator.validate(this.configBuilder.toJSON()).subscribe({
    //   next: (result) => {
    //     if (result.valid) {
    //       this.validateState.set('valid');
    //       this.demoLauncher.openDemo();
    //     } else {
    //       this.validateState.set('invalid');
    //       this.validationErrors.set(result.errors);
    //       this.messageService.add({
    //         severity: 'error',
    //         summary: 'الكونفيج فيه أخطاء',
    //         detail: result.errors.length + ' أخطاء — شوف التفاصيل أسفل الصفحة',
    //         life: 5000,
    //       });
    //     }
    //   },
    //   error: () => {
    //     this.validateState.set('idle');
    //     this.messageService.add({
    //       severity: 'warn',
    //       summary: 'تعذّر التحقق',
    //       detail: 'مش قادر يوصل للـ schema دلوقتي — الديمو هيفتح بدون validation.',
    //       life: 4000,
    //     });
    //     this.demoLauncher.openDemo();
    //   },
    // });

    this.demoLauncher.openDemo();
  }

  clearValidationErrors(): void {
    this.validateState.set('idle');
    this.validationErrors.set([]);
  }

  // ── Step 13: Publish ──────────────────────────────────────────────────────────

  /** حالة الـ publish flow */
  readonly publishState = signal<
    'idle' | 'validating' | 'publishing' | 'done' | 'error'
  >('idle');
  /** الرابط اللي رجع من الـ backend بعد النشر الناجح */
  readonly publishedUrl = signal<string | null>(null);

  readonly isPublishing = computed(
    () =>
      this.publishState() === 'validating' ||
      this.publishState() === 'publishing'
  );

  /**
   * Flow النشر الكامل (Step 13):
   *   1. validate الكونفيج (Step 11 — نفس الـ validator)
   *   2. لو صح → POST /api/configs (PublishService)
   *   3. عرض الـ previewUrl في رسالة نجاح
   */
  publishConfig(): void {
    if (!this.canPreview()) return;

    this.publishState.set('validating');
    this.validationErrors.set([]);
    this.publishedUrl.set(null);

    const config = this.configBuilder.toJSON();

    // ── Step 1: validate ────────────────────────────────────────────────────
    this.configValidator.validate(config).subscribe({
      next: (result) => {
        if (!result.valid) {
          // نفس الـ errors panel بتاع Step 11
          this.publishState.set('idle');
          this.validateState.set('invalid');
          this.validationErrors.set(result.errors);
          this.messageService.add({
            severity: 'error',
            summary: 'الكونفيج فيه أخطاء — مش قادر ينشر',
            detail: `${result.errors.length} ${result.errors.length === 1 ? 'خطأ' : 'أخطاء'} — صلّحها الأول`,
            life: 6000
          });
          return;
        }

        // ── Step 2: publish ────────────────────────────────────────────────
        this.publishState.set('publishing');

        this.publishService.publish(config).subscribe({
          next: (publishResult) => {
            this.publishState.set('done');
            this.publishedUrl.set(publishResult.previewUrl);
            this.messageService.add({
              severity: 'success',
              summary: '✅ تم النشر بنجاح',
              detail: `رابط المعاينة: ${publishResult.previewUrl}`,
              life: 10000
            });
          },
          error: (err: PublishError) => {
            this.publishState.set('error');
            this.messageService.add({
              severity: 'error',
              summary: 'فشل النشر',
              detail: err.message,
              life: 8000
            });
          }
        });
      },
      error: () => {
        // فشل جلب الـ schema — ننشر بدون validation (نفس fallback الـ Demo)
        this.publishState.set('publishing');
        this.publishService.publish(config).subscribe({
          next: (publishResult) => {
            this.publishState.set('done');
            this.publishedUrl.set(publishResult.previewUrl);
            this.messageService.add({
              severity: 'success',
              summary: '✅ تم النشر (بدون validation)',
              detail: `رابط المعاينة: ${publishResult.previewUrl}`,
              life: 10000
            });
          },
          error: (err: PublishError) => {
            this.publishState.set('error');
            this.messageService.add({
              severity: 'error',
              summary: 'فشل النشر',
              detail: err.message,
              life: 8000
            });
          }
        });
      }
    });
  }

  /** ينسخ الـ URL للـ clipboard */
  copyPreviewUrl(): void {
    const url = this.publishedUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'تم النسخ',
        detail: url,
        life: 3000
      });
    });
  }
}
