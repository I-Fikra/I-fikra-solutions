
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ProcessStep } from '../models/detail-page.models';

@Component({
    selector: 'app-dp-process-timeline',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DatePipe, TranslocoModule],
    templateUrl: './process-timeline.component.html',
    styleUrl:    './process-timeline.component.scss',
})
export class DpProcessTimelineComponent {
    steps    = input<ProcessStep[] | null | undefined>(null);
    emptyKey = input<string>('message.noSteps');
}