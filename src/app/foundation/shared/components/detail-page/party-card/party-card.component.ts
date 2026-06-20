/**
 * party-card.component.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the identity block + metadata rows for a Sender or Receiver.
 * Meant to be placed inside an <app-dp-detail-card> with sender/receive variant.
 */

import {
    Component,
    ChangeDetectionStrategy,
    input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

import { PartyCardData } from '../models/detail-page.models';

export type PartyVariant = 'sender' | 'receiver';

@Component({
    selector: 'app-dp-party-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslocoModule],
    templateUrl: './party-card.component.html',
    styleUrl:    './party-card.component.scss',
})
export class DpPartyCardComponent {
    // ── Inputs ────────────────────────────────────────────────────────────────
    variant = input.required<PartyVariant>();
    data    = input.required<PartyCardData>();

    // ── Helpers ───────────────────────────────────────────────────────────────
    display(value: unknown): string {
        if (value === null || value === undefined || value === '') return '—';
        return String(value);
    }
}