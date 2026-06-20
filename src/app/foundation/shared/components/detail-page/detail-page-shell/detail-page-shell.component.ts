/**
 * detail-page-shell.component.ts
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-dp-shell',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, TranslocoModule],
    templateUrl: './detail-page-shell.component.html',
    styleUrl:    './detail-page-shell.component.scss',
})
export class DpShellComponent {
    loading         = input.required<boolean>();
    hasData         = input.required<boolean>();
    notFoundKey     = input<string>('shared.notFound');
    notFoundDescKey = input<string>('shared.notFoundDesc');

    backClick = output<void>();
}