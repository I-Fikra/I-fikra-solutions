/**
 * timestamp-sidebar.component.ts
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { TimestampEntry } from '../models/detail-page.models';

@Component({
    selector: 'app-dp-timestamp-sidebar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DatePipe, TranslocoModule],
    templateUrl: './timestamp-sidebar.component.html',
    styleUrl:    './timestamp-sidebar.component.scss',
})
export class DpTimestampSidebarComponent {
    entries = input.required<TimestampEntry[]>();
}