import {
  Component,
  computed,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AppLanguage,
  BrandingConfig,
  LocalizedText,
  SocialPlatform,
  SOCIAL_PLATFORMS,
  SUPPORTED_APP_LANGUAGES
} from '@/app/domains/sol/configuration/infrastructure/branding.service';

@Component({
  selector: 'app-branding-social',
  imports: [FormsModule, InputTextModule, TextareaModule, TranslocoPipe],
  templateUrl: './branding-social.html',
  encapsulation: ViewEncapsulation.None
})
export class BrandingSocial {
  readonly form = input.required<BrandingConfig>();
  readonly ogImagePreview = input<string | null>(null);
  readonly submitted = input<boolean>(false);

  readonly patch = output<Partial<BrandingConfig>>();
  readonly ogImagePreviewChange = output<string | null>();

  /** Languages the generated app currently ships with, in catalog order. */
  readonly activeLanguages = computed<AppLanguage[]>(() =>
    SUPPORTED_APP_LANGUAGES.filter((lang) =>
      this.form().languages.includes(lang.code)
    )
  );

  /** Catalog of social networks the client can link to — see `SOCIAL_PLATFORMS`. */
  readonly socialPlatforms: readonly SocialPlatform[] = SOCIAL_PLATFORMS;

  linkFor(key: string): string {
    return this.form().socialLinks[key] ?? '';
  }

  patchSocialLink(key: string, value: string): void {
    const current = this.form().socialLinks;
    this.patch.emit({ socialLinks: { ...current, [key]: value } });
  }

  /** Picks the first active-language value that's actually filled in, else ''. */
  private firstNonEmpty(...values: LocalizedText[]): string {
    for (const lang of this.activeLanguages()) {
      for (const value of values) {
        const text = value[lang.code];
        if (text) return text;
      }
    }
    return '';
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

  readonly previewDomain = computed(() => {
    const url = this.form().siteUrl.trim();
    if (!url) return 'yourapp.com';
    const withoutProtocol = url.replace(/^[a-z]+:\/\//i, '');
    const host = withoutProtocol.split('/')[0];
    return host.replace(/^www\./i, '') || 'yourapp.com';
  });

  readonly previewTitle = computed(() => {
    const f = this.form();
    return this.firstNonEmpty(f.ogTitle, f.appName) || 'App Name';
  });

  readonly previewDescription = computed(() => {
    const f = this.form();
    return (
      this.firstNonEmpty(f.ogDescription, f.metaDescription) ||
      'App description goes here...'
    );
  });

  onOgImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.ogImagePreviewChange.emit(result);
      this.patch.emit({ ogImage: result });
    };
    reader.readAsDataURL(file);
  }

  removeOgImage(): void {
    this.ogImagePreviewChange.emit(null);
    this.patch.emit({ ogImage: null });
  }
}
