/**
 * detail-field.component.ts
 */

import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
    inject,
    Output,
    EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-dp-detail-field',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslocoModule],
    templateUrl: './detail-field.component.html',
    styleUrl: './detail-field.component.scss',
})
export class DpDetailFieldComponent {
    // ── Inputs ────────────────────────────────────────────────────────────────
    /**
     * Pre-translated label string from the API — takes precedence over labelKey.
     * Used when the consuming component calls fieldLabel() which returns
     * the localised string directly from meta_data.
     */
    label    = input<string | null | undefined>(undefined);

    /**
     * Transloco key fallback — used only when label is not provided.
     * e.g. 'schema.name', 'message.status'
     */
    labelKey = input<string>('');

    value       = input<unknown>(null);
    isCode      = input<boolean>(false);
    isMono      = input<boolean>(false);
    subValue    = input<string | null | undefined>(null);
    icon        = input<string>('');
    copyable    = input<boolean>(false);
    isLink      = input<boolean>(false);
    hint        = input<string>('');
    customClass = input<string>('');

    // ── Outputs ───────────────────────────────────────────────────────────────
    @Output() copied = new EventEmitter<{ success: boolean; label: string; value: string }>();

    // ── Injects ───────────────────────────────────────────────────────────────
    private readonly transloco = inject(TranslocoService);

    // ── Derived ──────────────────────────────────────────────────────────────
    isEmpty = computed(() => {
        const v = this.value();
        return v === null || v === undefined || v === '';
    });

    displayValue = computed(() => {
        const v = this.value();
        if (v === null || v === undefined || v === '') return '—';
        if (v instanceof Date) return v.toLocaleDateString();
        if (typeof v === 'number') return v.toLocaleString();
        if (Array.isArray(v)) return v.join(', ');
        return String(v);
    });

    // ── Public Methods ───────────────────────────────────────────────────────
    getCodeVariant(): string {
        const value = this.displayValue();
        if (value.length > 50) return 'long';
        if (value.includes('-') || value.includes('_')) return 'id';
        return 'default';
    }

    getStatusIndicator(): string | null {
        const value = this.displayValue().toLowerCase();
        if (value === 'active' || value === 'success') return 'success';
        if (value === 'warning' || value === 'pending') return 'warning';
        if (value === 'error' || value === 'failed') return 'error';
        return null;
    }

    copyToClipboard(event: Event): void {
        event.stopPropagation();
        const textToCopy = this.displayValue();
        if (textToCopy === '—') return;

        // Prefer the direct label string; fall back to transloco key resolution
        const labelText: string = this.label() ?? this.transloco.translate(this.labelKey()) ?? '';

        navigator.clipboard.writeText(textToCopy).then(
            () => {
                this.copied.emit({ success: true, label: labelText, value: textToCopy });
            },
            () => {
                this.copied.emit({ success: false, label: labelText, value: textToCopy });
            }
        );
    }

    onLinkClick(): void {
        const value = this.displayValue();
        if (value && value !== '—') {
            window.open(`/details/${encodeURIComponent(value)}`, '_blank');
        }
    }
}