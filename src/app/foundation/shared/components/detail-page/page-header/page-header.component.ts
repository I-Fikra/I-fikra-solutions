/**
 * page-header.component.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared page-header shell used by every detail page.
 *
 * Renders:
 *  • Back button + breadcrumb navigation row
 *  • Page icon, title, optional reference ID
 *  • Status badge (optional)
 *  • Action-bar buttons (optional, driven by @Input actions array)
 */

import {
    Component,
    ChangeDetectionStrategy,
    input,
    output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule  } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

import {
    PageHeaderAction,
    BreadcrumbConfig,
} from '../models/detail-page.models';

@Component({
    selector: 'app-dp-page-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ButtonModule,
        TooltipModule,
        TranslocoModule,
    ],
    templateUrl: './page-header.component.html',
    styleUrl:    './page-header.component.scss',
})
export class DpPageHeaderComponent {
    // ── Inputs ────────────────────────────────────────────────────────────────
    /**
     * Transloco key for the `<h1>` title, e.g. 'message.detailsTitle'.
     * Optional when `title` is supplied directly from the API.
     */
    titleKey    = input<string>('');

    /**
     * Ready-made string title from the API — takes precedence over titleKey.
     */
    title       = input<string | null | undefined>(undefined);

    /** PrimeIcons class without the 'pi' prefix, e.g. 'pi-envelope' */
    iconClass   = input.required<string>();

    /** Breadcrumb parent / current labels */
    breadcrumb  = input.required<BreadcrumbConfig>();

    /** Optional reference id shown as `#<refId>` */
    refId       = input<string | null | undefined>(null);

    /** Pre-translated status label (host should pipe through transloco) */
    statusLabel = input<string | null | undefined>(null);

    /** CSS text colour for the status badge */
    statusColor       = input<string>('');
    statusBgColor     = input<string>('');
    statusBorderColor = input<string>('');

    /** Action buttons to render in the toolbar */
    actions = input<PageHeaderAction[]>([]);

    // ── Outputs ───────────────────────────────────────────────────────────────
    /** Emitted when the back button or breadcrumb parent is clicked */
    backClick   = output<void>();

    /** Emitted when any action button is clicked; carries the action string */
    actionClick = output<string>();
}