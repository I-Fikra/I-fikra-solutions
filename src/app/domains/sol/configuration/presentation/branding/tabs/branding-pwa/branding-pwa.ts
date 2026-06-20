import {
  Component,
  computed,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AppLanguage,
  BrandingConfig,
  LocalizedText,
  SUPPORTED_APP_LANGUAGES
} from '@/app/domains/sol/configuration/infrastructure/branding.service';

@Component({
  selector: 'app-branding-pwa',
  imports: [FormsModule, InputTextModule, TranslocoPipe],
  templateUrl: './branding-pwa.html',
  encapsulation: ViewEncapsulation.None
})
export class BrandingPwa {
  readonly form = input.required<BrandingConfig>();
  readonly submitted = input<boolean>(false);
  readonly patch = output<Partial<BrandingConfig>>();

  /** Languages the generated app currently ships with, in catalog order. */
  readonly activeLanguages = computed<AppLanguage[]>(() =>
    SUPPORTED_APP_LANGUAGES.filter((lang) =>
      this.form().languages.includes(lang.code)
    )
  );

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
}
