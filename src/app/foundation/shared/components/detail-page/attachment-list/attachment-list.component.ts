/**
 * attachment-list.component.ts
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { AttachmentItem } from '../models/detail-page.models';

@Component({
    selector: 'app-dp-attachment-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TooltipModule, TranslocoModule],
    templateUrl: './attachment-list.component.html',
    styleUrl:    './attachment-list.component.scss',
})
export class DpAttachmentListComponent {

    // ── Inputs ────────────────────────────────────────────────────────────────

    attachments = input<AttachmentItem[] | null | undefined>(null);
    emptyKey    = input<string>('shared.noAttachments');

    // ── Outputs ───────────────────────────────────────────────────────────────

    viewFile     = output<AttachmentItem>();
    downloadFile = output<AttachmentItem>();

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns a PrimeIcons class based on the file extension. */
    getFileIcon(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        const map: Record<string, string> = {
            pdf:  'pi-file-pdf',
            json: 'pi-code',
            xml:  'pi-code',
            csv:  'pi-table',
            xls:  'pi-table',
            xlsx: 'pi-table',
            zip:  'pi-box',
            png:  'pi-image',
            jpg:  'pi-image',
            jpeg: 'pi-image',
            svg:  'pi-image',
            html: 'pi-globe',
            htm:  'pi-globe',
            txt:  'pi-align-left',
            md:   'pi-align-left',
        };
        return map[ext] ?? 'pi-file';
    }
}