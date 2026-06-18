import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-popup-shell',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="app-popup-shell" (click)="onOverlayClick($event)">
            <div
                class="app-popup-shell-inner bg-surface-0 dark:bg-surface-900"
                (click)="$event.stopPropagation()"
            >
                <ng-content />
            </div>
        </div>
    `
})
export class PopupShell {
    @Output() dismissed = new EventEmitter<void>();

    onOverlayClick(event: MouseEvent): void {
        this.dismissed.emit();
    }
}
