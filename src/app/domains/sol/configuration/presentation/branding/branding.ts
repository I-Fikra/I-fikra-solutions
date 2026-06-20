import {
  BrandingConfig,
  BrandingService,
  LocalizedDocument,
  LocalizedText,
  SOCIAL_PLATFORMS,
  SocialPlatform,
  SUPPORTED_APP_LANGUAGES,
  AppLanguage
} from '@/app/domains/sol/configuration/infrastructure/branding.service';
import {
  Component,
  computed,
  inject,
  output,
  signal,
  ViewEncapsulation,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TRANSLOCO_SCOPE, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

type DocumentField = 'privacyPolicyDocument' | 'termsDocument';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    ToastModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    TooltipModule,
    TranslocoPipe
  ],
  templateUrl: './branding.html',
  providers: [
    MessageService,
    { provide: TRANSLOCO_SCOPE, useValue: 'configuration' }
  ],
  encapsulation: ViewEncapsulation.None
})
export class Branding {
  readonly brandingService = inject(BrandingService);
  readonly messageService  = inject(MessageService);
  private readonly t       = inject(TranslocoService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly saved = output<void>();

  // ── Form state ────────────────────────────────────────────────────────────
  brandingForm   = signal<BrandingConfig>({ ...this.brandingService.config() });
  logoPreview    = signal<string | null>(this.brandingService.logo());
  faviconPreview = signal<string | null>(this.brandingService.favicon());
  ogImagePreview = signal<string | null>(this.brandingService.config().ogImage);
  submitted      = signal(false);

  // ── Language helpers ──────────────────────────────────────────────────────
  readonly availableLanguages: readonly AppLanguage[] = SUPPORTED_APP_LANGUAGES;
  readonly activeLanguages = computed<AppLanguage[]>(() =>
    this.availableLanguages.filter(l => this.brandingForm().languages.includes(l.code))
  );

  isLanguageActive(code: string): boolean {
    return this.brandingForm().languages.includes(code);
  }

  toggleLanguage(code: string): void {
    const langs = this.brandingForm().languages;
    if (langs.includes(code)) {
      if (langs.length === 1) return; // keep at least one
      this.brandingForm.update(f => ({ ...f, languages: langs.filter(l => l !== code) }));
    } else {
      this.brandingForm.update(f => ({ ...f, languages: [...langs, code] }));
    }
  }

  // ── Social platforms ──────────────────────────────────────────────────────
  readonly socialPlatforms: readonly SocialPlatform[] = SOCIAL_PLATFORMS;

  // ── Patch helpers ─────────────────────────────────────────────────────────
  onPatch(partial: Partial<BrandingConfig>): void {
    this.brandingForm.update(f => ({ ...f, ...partial }));
  }

  patchLocalized(field: keyof BrandingConfig, lang: string, value: string): void {
    this.brandingForm.update(f => ({
      ...f,
      [field]: { ...(f[field] as LocalizedText), [lang]: value }
    }));
  }

  linkFor(key: string): string {
    return (this.brandingForm().socialLinks as Record<string, string>)[key] ?? '';
  }

  patchSocialLink(key: string, value: string): void {
    this.brandingForm.update(f => ({
      ...f,
      socialLinks: { ...f.socialLinks, [key]: value }
    }));
  }

  // ── Version helpers ───────────────────────────────────────────────────────
  readonly versionParts = computed(() => {
    const parts = (this.brandingForm().metaVersion || '1.0.0').split('.');
    return {
      major: Math.max(0, parseInt(parts[0] ?? '1', 10) || 0),
      minor: Math.max(0, parseInt(parts[1] ?? '0', 10) || 0),
      patch: Math.max(0, parseInt(parts[2] ?? '0', 10) || 0)
    };
  });

  patchVersion(part: 'major' | 'minor' | 'patch', value: number): void {
    const v = this.versionParts();
    const updated = { ...v, [part]: Math.max(0, value || 0) };
    this.onPatch({ metaVersion: `${updated.major}.${updated.minor}.${updated.patch}` });
  }

  // ── Logo upload ───────────────────────────────────────────────────────────
  triggerLogoUpload(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('logo-upload-trigger')?.click();
  }

  onLogoFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.logoPreview.set(result);
      this.onPatch({ logo: result });
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview.set(null);
    this.onPatch({ logo: null });
  }

  // ── Favicon upload ────────────────────────────────────────────────────────
  onFaviconFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!isPlatformBrowser(this.platformId)) {
        this.faviconPreview.set(result);
        this.onPatch({ favicon: result });
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth !== image.naturalHeight) {
          this.messageService.add({
            severity: 'error',
            summary: this.t.translate('configuration.branding.messages.invalidFavicon.summary'),
            detail: this.t.translate('configuration.branding.messages.invalidFavicon.detail')
          });
          inputEl.value = '';
          return;
        }
        this.faviconPreview.set(result);
        this.onPatch({ favicon: result });
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
  }

  triggerFaviconUpload(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('favicon-upload-trigger')?.click();
  }

  removeFavicon(): void {
    this.faviconPreview.set(null);
    this.onPatch({ favicon: null });
  }

  // ── OG Image upload ───────────────────────────────────────────────────────
  onOgImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.ogImagePreview.set(result);
      this.onPatch({ ogImage: result });
    };
    reader.readAsDataURL(file);
  }

  removeOgImage(): void {
    this.ogImagePreview.set(null);
    this.onPatch({ ogImage: null });
  }

  // ── Document upload ───────────────────────────────────────────────────────
  onDocumentFileChange(field: DocumentField, code: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    const allowed = new Set(['html', 'htm', 'txt', 'docx']);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedMime = new Set([
      'text/html', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    if (!allowed.has(ext) && !allowedMime.has(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: this.t.translate('configuration.branding.messages.invalidFileType.summary'),
        detail: this.t.translate('configuration.branding.messages.invalidFileType.detail')
      });
      inputEl.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.patchDocument(field, code, reader.result as string);
    reader.readAsDataURL(file);
  }

  removeDocument(field: DocumentField, code: string): void {
    this.patchDocument(field, code, null);
  }

  private patchDocument(field: DocumentField, code: string, value: string | null): void {
    const current = this.brandingForm()[field] as LocalizedDocument;
    this.brandingForm.update(f => ({
      ...f,
      [field]: { ...current, [code]: value }
    }));
  }

  // ── OG preview helpers ────────────────────────────────────────────────────
  private firstNonEmpty(...values: LocalizedText[]): string {
    for (const lang of this.activeLanguages()) {
      for (const value of values) {
        const text = value[lang.code];
        if (text) return text;
      }
    }
    return '';
  }

  readonly previewName = computed(() => {
    const f = this.brandingForm();
    for (const lang of this.activeLanguages()) {
      const value = f.appName[lang.code];
      if (value) return value;
    }
    return '';
  });

  readonly previewDomain = computed(() => {
    const url = this.brandingForm().siteUrl.trim();
    if (!url) return 'yourapp.com';
    const withoutProtocol = url.replace(/^[a-z]+:\/\//i, '');
    const host = withoutProtocol.split('/')[0];
    return host.replace(/^www\./i, '') || 'yourapp.com';
  });

  readonly previewTitle = computed(() => {
    const f = this.brandingForm();
    return this.firstNonEmpty(f.ogTitle, f.appName) || 'App Name';
  });

  readonly previewDescription = computed(() => {
    const f = this.brandingForm();
    return this.firstNonEmpty(f.ogDescription, f.metaDescription) || 'App description goes here...';
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  saveBranding(): void {
    this.submitted.set(true);
    this.brandingService.save(this.brandingForm());
    this.saved.emit();
    this.messageService.add({
      severity: 'success',
      summary: this.t.translate('configuration.branding.messages.saved.summary'),
      detail: this.t.translate('configuration.branding.messages.saved.detail')
    });
  }

  // ── Live Review ───────────────────────────────────────────────────────────
  openLiveReview(): void {
    console.log('[Branding] Live Review', this.brandingForm());
  }
}
