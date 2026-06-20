import {
  Component,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  ViewEncapsulation
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AppLanguage,
  BrandingConfig,
  LocalizedText,
  SUPPORTED_APP_LANGUAGES
} from '@/app/domains/sol/configuration/infrastructure/branding.service';

@Component({
  selector: 'app-branding-identity',
  imports: [FormsModule, InputTextModule, ToggleSwitchModule, TooltipModule, TranslocoPipe],
  templateUrl: './branding-identity.html',
  encapsulation: ViewEncapsulation.None
})
export class BrandingIdentity {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly messageService = inject(MessageService);
  private readonly t = inject(TranslocoService);

  readonly form = input.required<BrandingConfig>();
  readonly logoPreview = input<string | null>(null);
  readonly faviconPreview = input<string | null>(null);
  readonly submitted = input<boolean>(false);

  readonly patch = output<Partial<BrandingConfig>>();
  readonly logoPreviewChange = output<string | null>();
  readonly faviconPreviewChange = output<string | null>();

  // ── App languages (controls which locale columns appear across all branding tabs) ──
  /** Full catalog the client can choose from — see `SUPPORTED_APP_LANGUAGES`. */
  readonly availableLanguages: readonly AppLanguage[] = SUPPORTED_APP_LANGUAGES;

  /** Languages the generated app currently ships with, in catalog order. */
  readonly activeLanguages = computed<AppLanguage[]>(() =>
    this.availableLanguages.filter((lang) =>
      this.form().languages.includes(lang.code)
    )
  );

  isLanguageActive(code: string): boolean {
    return this.form().languages.includes(code);
  }

  /** Toggles a language on/off — at least one language must always remain selected. */
  toggleLanguage(code: string): void {
    const current = this.form().languages;
    const isActive = current.includes(code);
    if (isActive && current.length === 1) return;

    const languages = isActive
      ? current.filter((c) => c !== code)
      : [...current, code];
    this.patch.emit({ languages });
  }

  /**
   * Merges a single language's value into a `LocalizedText` field and emits the patch.
   * (Angular template expressions can't use computed property names like `{ [code]: value }`,
   * so the merge has to happen here rather than inline in the template.)
   */
  patchLocalized(
    field: keyof BrandingConfig,
    code: string,
    value: string
  ): void {
    const current = this.form()[field] as LocalizedText;
    this.patch.emit({
      [field]: { ...current, [code]: value }
    } as Partial<BrandingConfig>);
  }

  /** Identity preview shows the first active language that actually has a value. */
  readonly previewName = computed(() => {
    const f = this.form();
    for (const lang of this.activeLanguages()) {
      const value = f.appName[lang.code];
      if (value) return value;
    }
    return '';
  });

  readonly versionParts = computed(() => {
    const parts = (this.form().metaVersion || '1.0.0').split('.');
    return {
      major: Math.max(0, parseInt(parts[0] ?? '1', 10) || 0),
      minor: Math.max(0, parseInt(parts[1] ?? '0', 10) || 0),
      patch: Math.max(0, parseInt(parts[2] ?? '0', 10) || 0)
    };
  });

  patchVersion(part: 'major' | 'minor' | 'patch', value: number): void {
    const v = this.versionParts();
    const updated = { ...v, [part]: Math.max(0, value || 0) };
    this.patch.emit({
      metaVersion: `${updated.major}.${updated.minor}.${updated.patch}`
    });
  }

  onLogoFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.logoPreviewChange.emit(result);
      this.patch.emit({ logo: result });
    };
    reader.readAsDataURL(file);
  }

  onFaviconFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;

      if (!isPlatformBrowser(this.platformId)) {
        this.faviconPreviewChange.emit(result);
        this.patch.emit({ favicon: result });
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
        this.faviconPreviewChange.emit(result);
        this.patch.emit({ favicon: result });
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
  }

  triggerLogoUpload(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('logo-upload-trigger')?.click();
  }

  removeLogo(): void {
    this.logoPreviewChange.emit(null);
    this.patch.emit({ logo: null });
  }

  removeFavicon(): void {
    this.faviconPreviewChange.emit(null);
    this.patch.emit({ favicon: null });
  }
}
