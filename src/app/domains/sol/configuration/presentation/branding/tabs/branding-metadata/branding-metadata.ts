import {
  Component,
  computed,
  inject,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  AppLanguage,
  BrandingConfig,
  LocalizedDocument,
  LocalizedText,
  SUPPORTED_APP_LANGUAGES
} from '@/app/services/sol/configuration/infrastructure/branding.service';

/** The two legal documents collected on this tab — one upload per active language each. */
type DocumentField = 'privacyPolicyDocument' | 'termsDocument';

@Component({
  selector: 'app-branding-metadata',
  imports: [FormsModule, InputTextModule, TextareaModule, TooltipModule, TranslocoPipe],
  templateUrl: './branding-metadata.html',
  encapsulation: ViewEncapsulation.None
})
export class BrandingMetadata {
  private readonly messageService = inject(MessageService);
  private readonly t = inject(TranslocoService);

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

  onDocumentFileChange(field: DocumentField, code: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!this.isAllowedDocumentType(file)) {
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

  /** Checks both MIME type and extension — the `accept` attribute is a UI hint only and can be bypassed. */
  private isAllowedDocumentType(file: File): boolean {
    const allowed = new Set(['html', 'htm', 'txt', 'docx']);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedMime = new Set([
      'text/html',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    return allowed.has(ext) || allowedMime.has(file.type);
  }

  removeDocument(field: DocumentField, code: string): void {
    this.patchDocument(field, code, null);
  }

  private patchDocument(field: DocumentField, code: string, value: string | null): void {
    const current = this.form()[field] as LocalizedDocument;
    this.patch.emit({
      [field]: { ...current, [code]: value }
    } as Partial<BrandingConfig>);
  }
}
