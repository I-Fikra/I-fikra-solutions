/**
 * dp-validation-messages.component.ts
 *
 * A compact sidebar card that lists all validation messages (errors, warnings,
 * info, success) as toast-style chips. Clicking any chip opens a detail dialog.
 *
 * Usage in message-details.html (slot="aside"):
 *
 *   <app-dp-validation-messages
 *       slot="aside"
 *       [errors]="errors()"
 *       [warnings]="warnings()"
 *       [infoMessages]="infoMessages()"
 *       [successMessages]="successMessages()"
 *   />
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogShellComponent } from '../../dialog-shell';
import { ValidationMessage } from '@/app/domains/msg/messages/services/messages-mock.service';

export type MessageSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'error'
  | 'secondary'
  | 'contrast';

export interface ValidationEntry {
  severity: MessageSeverity;
  labelKey: string;
  detail: string;
  /** Human-readable section label shown in the chip (e.g. "الكود") */
  fieldLabel?: string;
  /** Human-readable title of the validation message */
  title?: string;
  /** Machine code, e.g. ERR-4001 */
  code?: string;
  /** Symbolic constant, e.g. MSG_PROCESSING_FAILED */
  syntax?: string;
  /** Full descriptive explanation */
  description?: string;
}

@Component({
  selector: 'app-dp-validation-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogShellComponent],
  templateUrl: './dp-validation-messages.component.html',
  styleUrl: './dp-validation-messages.component.scss'
})
export class DpValidationMessagesComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  errors = input<ValidationMessage[]>([]);
  warnings = input<ValidationMessage[]>([]);
  infoMessages = input<ValidationMessage[]>([]);
  successMessages = input<ValidationMessage[]>([]);
  title = input<string>('Messages');

  // ── Dialog state ──────────────────────────────────────────────────────────
  dialogVisible = signal(false);
  activeEntry = signal<ValidationEntry | null>(null);

  // ── All entries merged & ordered: errors first, then warn, info, success ──
  allEntries = computed<ValidationEntry[]>(() => [
    ...this.errors().map((m) => this.toEntry(m, 'error')),
    ...this.warnings().map((m) => this.toEntry(m, 'warn')),
    ...this.infoMessages().map((m) => this.toEntry(m, 'info')),
    ...this.successMessages().map((m) => this.toEntry(m, 'success'))
  ]);

  hasMessages = computed(() => this.allEntries().length > 0);

  // ── Counts per severity for the card header badge ─────────────────────────
  errorCount = computed(() => this.errors().length);
  warningCount = computed(() => this.warnings().length);

  // ── Severity helpers ──────────────────────────────────────────────────────
  severityIcon(s: MessageSeverity): string {
    return (
      {
        success: 'pi-check-circle',
        info: 'pi-info-circle',
        warn: 'pi-exclamation-triangle',
        error: 'pi-times-circle',
        secondary: 'pi-circle',
        contrast: 'pi-circle'
      }[s] ?? 'pi-circle'
    );
  }

  severityLabel(s: MessageSeverity): string {
    return (
      {
        success: 'Success',
        info: 'Info',
        warn: 'Warning',
        error: 'Error',
        secondary: 'Note',
        contrast: 'Note'
      }[s] ?? s
    );
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  openDetail(entry: ValidationEntry): void {
    this.activeEntry.set(entry);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.activeEntry.set(null);
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private toEntry(
    m: ValidationMessage,
    severity: MessageSeverity
  ): ValidationEntry {
    return {
      severity,
      labelKey: m.labelKey,
      detail: m.detail,
      title: m.title,
      code: m.code,
      syntax: m.syntax,
      description: m.description
    };
  }
}
