/**
 * detail-card.component.ts
 */

import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

export type DetailCardIconVariant = 'default' | 'send' | 'receive';

@Component({
    selector: 'app-dp-detail-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoModule],
    templateUrl: './detail-card.component.html',
    styleUrl:    './detail-card.component.scss',
})
export class DpDetailCardComponent {

    // ── Inputs ────────────────────────────────────────────────────────────────

    /** PrimeIcons class, e.g. 'pi-info-circle' */
    icon = input.required<string>();

    /**
     * Transloco key for the card title — required UNLESS `title` is provided.
     * Use when the label is a static i18n key.
     */
    titleKey = input<string>('');

    /**
     * Ready-made string title — takes precedence over titleKey.
     * Use when the label comes from the API (meta_data).
     */
    title = input<string | null | undefined>(undefined);

    /** Icon tint variant */
    iconVariant = input<DetailCardIconVariant>('default');

    /**
     * Optional count badge shown after the title.
     * Pass null or undefined to hide it.
     */
    countBadge = input<number | null | undefined>(undefined);

    /** Strips body padding — use for payload viewers, tables, etc. */
    noPad = input<boolean>(false);

    // ── Derived ───────────────────────────────────────────────────────────────

    /**
     * The key passed to transloco — empty string when `title` is used directly.
     */
    resolvedTitleKey = computed(() => this.title() ? '' : this.titleKey());

    /**
     * Stable element id for aria-labelledby wiring.
     */
    titleId = computed(() =>
        'dp-section-' + (this.title() ?? this.titleKey()).replace(/\./g, '-'),
    );
}