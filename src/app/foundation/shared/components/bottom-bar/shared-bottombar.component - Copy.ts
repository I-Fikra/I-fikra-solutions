import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DeleteButtonComponent } from '../delete-button/delete-button.component';
import { BottomBarAction } from '../../models/table.models';

/**
 * Floating multi-select action bar.
 * Slides up from the bottom when `visible` is true.
 *
 * @example
 * <app-shared-bottom-bar
 *   [visible]="selection.length > 0"
 *   [count]="selection.length"
 *   itemLabel="role"
 *   (bulkDelete)="deleteSelected()"
 *   (clearSelection)="selection = []"
 * />
 */
@Component({
    selector: 'app-shared-bottom-bar',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TooltipModule,
        DividerModule,
        DeleteButtonComponent,
        TranslocoModule
    ],
    template: `
        <div class="bottom-bar-wrapper" [class.visible]="visible">
            <div class="bottom-bar">
                <!-- Selection count -->
                <div class="bottom-bar__count">
                    <span class="count-badge">{{ count }}</span>
                    <span class="count-label">
                        {{ count === 1 ? itemLabel : itemLabelPlural }}
                        {{ 'shared.bottomBar.selectedSuffix' | transloco }}
                    </span>
                </div>

                <p-divider layout="vertical" styleClass="bottom-bar__divider" />

                <!-- Non-destructive actions + Delete -->
                <div class="bottom-bar__actions">
                    <p-button
                        *ngFor="let action of nonDestructiveActions"
                        [label]="action.label"
                        [icon]="action.icon"
                        [severity]="action.severity ?? 'secondary'"
                        [outlined]="true"
                        size="small"
                        [pTooltip]="action.tooltip ?? ''"
                        tooltipPosition="top"
                        (onClick)="bulkAction.emit(action.key)"
                    />

                    <app-delete-button
                        [label]="'shared.common.delete' | transloco"
                        [rounded]="false"
                        [outlined]="true"
                        (confirm)="bulkDelete.emit()"
                    />
                </div>

                <!-- Dismiss -->
                <p-button
                    icon="pi pi-times"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    [pTooltip]="'shared.bottomBar.clearSelection' | transloco"
                    tooltipPosition="top"
                    (onClick)="clearSelection.emit()"
                />
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }

            .bottom-bar-wrapper {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(calc(100% + 3rem));
                z-index: 1000;
                transition:
                    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                    opacity 0.25s ease;
                opacity: 0;
                pointer-events: none;
            }
            .bottom-bar-wrapper.visible {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
                pointer-events: all;
            }
            .bottom-bar {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.625rem 1rem;
                background: var(--surface-overlay, var(--surface-card));
                border: 1px solid var(--surface-border);
                border-radius: 2rem;
                box-shadow:
                    0 8px 32px rgba(0, 0, 0, 0.18),
                    0 2px 8px rgba(0, 0, 0, 0.1);
                white-space: nowrap;
                backdrop-filter: blur(12px);
            }
            .bottom-bar__count {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .count-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 1.5rem;
                height: 1.5rem;
                padding: 0 0.35rem;
                border-radius: 999px;
                border: 1px solid var(--primary-color);
                color: var(--primary-color-text);
                font-size: 0.75rem;
                font-weight: 700;
            }
            .count-label {
                font-size: 0.875rem;
                color: var(--text-color);
                font-weight: 500;
            }
            :host ::ng-deep .bottom-bar__divider.p-divider-vertical {
                margin: 0 0.25rem;
                height: 1.5rem;
                align-self: center;
            }
            .bottom-bar__actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            :host ::ng-deep .bottom-bar__actions .p-button.p-button-sm,
            :host ::ng-deep .p-button.p-button-sm {
                height: 2rem;
                padding-block: 0;
            }
        `
    ]
})
export class SharedBottomBarComponent {
    private t = inject(TranslocoService);

    @Input() visible = false;
    @Input() count = 0;
    @Input() itemLabel = 'item';
    @Input() showDelete = true;
    @Input() actions: BottomBarAction[] = [];
    @Input() deleteTitle = '';
    @Input() deleteMessage = '';

    // Pluralise automatically when not explicitly provided
    private _itemLabelPlural = '';
    @Input() set itemLabelPlural(v: string) {
        this._itemLabelPlural = v;
    }
    get itemLabelPlural(): string {
        return this._itemLabelPlural || `${this.itemLabel}s`;
    }

    @Output() bulkAction = new EventEmitter<string>();
    @Output() bulkDelete = new EventEmitter<void>();
    @Output() clearSelection = new EventEmitter<void>();

    constructor() {
        this.deleteTitle = this.t.translate('shared.dialog.confirmDelete');
        this.deleteMessage = this.t.translate(
            'shared.dialog.deleteSelectedItems'
        );
    }

    get nonDestructiveActions(): BottomBarAction[] {
        return this.actions.filter((a) => !a.destructive);
    }
}
