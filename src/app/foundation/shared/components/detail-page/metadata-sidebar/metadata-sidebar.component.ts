/**
 * metadata-sidebar.component.ts
 */

import { Component, ChangeDetectionStrategy, input, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { MetadataItem, ValidationMessage } from '../models/detail-page.models';

/**
 * MetadataItem enriched with resolved validation state for the template.
 *
 * IMPORTANT: set `code` to the field's secondary_code (e.g. "code", "idempotency")
 * so that ValidationMessage.labelKey can match it.
 * Falling back to `label` (translated text) will never match a JSON labelKey.
 */
export interface EnrichedMetadataItem extends MetadataItem {
    code?:          string;   // secondary_code — the matching key for errors/warnings
    hasError:       boolean;
    errorMessage:   string | null;
    hasWarning:     boolean;
    warningMessage: string | null;
}

@Component({
    selector: 'app-dp-metadata-sidebar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './metadata-sidebar.component.html',
    styleUrl: './metadata-sidebar.component.scss',
    providers: [MessageService],
})
export class DpMetadataSidebarComponent implements OnDestroy {
    private messageService = inject(MessageService);

    items        = input.required<MetadataItem[]>();
    errors       = input<ValidationMessage[]>([]);
    warnings     = input<ValidationMessage[]>([]);
    infoMessages = input<ValidationMessage[]>([]);

    /** Items enriched with per-field error/warning state. */
    visibleItems = computed<EnrichedMetadataItem[]>(() => {
        const errorMap   = this.toMessageMap(this.errors());
        const warningMap = this.toMessageMap(this.warnings());

        return this.items()
            .filter(i => !this.isEmpty(i.value) || !(i as any).hideIfEmpty)
            .map(i => {
                // Match by code (secondary_code) first, fall back to label.
                // code is the reliable key because labelKey in the JSON is
                // always the secondary_code (e.g. "code"), never the translated label.
                const matchKey = (i as any).code ?? i.label ?? '';

                return {
                    ...i,
                    hasError:       !!matchKey && errorMap.has(matchKey),
                    errorMessage:   matchKey   ? (errorMap.get(matchKey)   ?? null) : null,
                    hasWarning:     !!matchKey && warningMap.has(matchKey),
                    warningMessage: matchKey   ? (warningMap.get(matchKey) ?? null) : null,
                };
            });
    });

    isEmpty(value: unknown): boolean {
        return value === null || value === undefined || value === '';
    }

    ngOnDestroy(): void {
        this.messageService.clear();
    }

    /**
     * Builds a secondary_code → message lookup from a ValidationMessage array.
     * ValidationMessage.labelKey must equal the field's secondary_code.
     */
    private toMessageMap(messages: ValidationMessage[]): Map<string, string> {
        return new Map(
            messages
                .filter((m): m is ValidationMessage & { labelKey: string } =>
                    m.labelKey != null
                )
                .map(m => [m.labelKey, m.detail])
        );
    }
}