import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnDestroy,
    ApplicationRef,
    createComponent,
    EnvironmentInjector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoService } from '@jsverse/transloco';
import { DialogShellComponent } from '../dialog-shell';

export type DeleteButtonVariant = 'icon-label' | 'icon-only' | 'label-only';

// ── Confirm Dialog Component (rendered at body level via Portal) ───────────
@Component({
    selector: 'app-delete-confirm-dialog',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogShellComponent],
    template: `
        <app-dialog-shell
            [visible]="true"
            [header]="title"
            [hideFooter]="true"
            [closable]="true"
            [dismissableMask]="true"
            [style]="{ width: '400px' }"
            (onHide)="onReject()"
        >
            <div class="delete-confirm">
                <div class="delete-confirm__icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <p class="delete-confirm__message">{{ message }}</p>
                <div class="delete-confirm__actions">
                    <p-button
                        [label]="rejectLabel"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="onReject()"
                    />
                    <p-button
                        [label]="acceptLabel"
                        icon="pi pi-trash"
                        severity="danger"
                        (onClick)="onAccept()"
                    />
                </div>
            </div>
        </app-dialog-shell>
    `,
    styles: [`
        .delete-confirm {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 0 0.25rem;
            text-align: center;
        }

        .delete-confirm__icon i {
            font-size: 2.5rem;
            color: var(--red-500);
        }

        .delete-confirm__message {
            margin: 0;
            font-size: 0.9375rem;
            color: var(--text-color-secondary);
            line-height: 1.6;
        }

        .delete-confirm__actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
            width: 100%;
            padding-top: 0.5rem;
        }
    `]
})
export class DeleteConfirmDialogComponent {
    title = '';
    message = '';
    acceptLabel = '';
    rejectLabel = '';

    onAccept!: () => void;
    onReject!: () => void;
}

// ── Main DeleteButtonComponent ─────────────────────────────────────────────
@Component({
    selector: 'app-delete-button',
    standalone: true,
    imports: [ButtonModule, TooltipModule],
    template: `
        <p-button
            [label]="resolvedLabel"
            [icon]="resolvedIcon"
            [severity]="severity"
            [outlined]="outlined"
            [rounded]="rounded"
            [loading]="loading"
            [disabled]="disabled"
            [pTooltip]="tooltip"
            tooltipPosition="top"
            (onClick)="open()"
        />
    `
})
export class DeleteButtonComponent implements OnDestroy {
    @Input() title: string = '';
    @Input() message: string = '';
    @Input() disabled: boolean = false;
    @Input() label: string | undefined;
    @Input() icon: string = 'pi pi-trash';
    @Input() severity: any = 'danger';
    @Input() rounded: boolean = true;
    @Input() outlined: boolean = true;
    @Input() variant: DeleteButtonVariant = 'icon-label';
    @Input() loading: boolean = false;
    @Input() tooltip: string = '';
    @Input() acceptLabel: string | undefined;
    @Input() rejectLabel: string | undefined;

    @Output() confirm = new EventEmitter<void>();
    @Output() reject = new EventEmitter<void>();

    private dialogRef: ReturnType<typeof createComponent<DeleteConfirmDialogComponent>> | null = null;
    private dialogHostEl: HTMLElement | null = null;

    constructor(
        private t: TranslocoService,
        private appRef: ApplicationRef,
        private environmentInjector: EnvironmentInjector,
    ) {}

    get resolvedLabel(): string | undefined {
        if (this.variant === 'icon-only') return undefined;
        return this.label ?? this.t.translate('shared.common.delete');
    }

    get resolvedIcon(): string {
        return this.variant === 'label-only' ? '' : this.icon;
    }

    open(): void {
        this.close();

        this.dialogRef = createComponent(DeleteConfirmDialogComponent, {
            environmentInjector: this.environmentInjector,
        });

        const instance = this.dialogRef.instance;
        instance.title       = this.title   || this.t.translate('shared.dialog.confirmDelete');
        instance.message     = this.message || this.t.translate('shared.dialog.deleteSelectedItems');
        instance.acceptLabel = this.acceptLabel ?? this.t.translate('shared.common.delete');
        instance.rejectLabel = this.rejectLabel ?? this.t.translate('shared.common.cancel');

        instance.onAccept = () => { this.close(); this.confirm.emit(); };
        instance.onReject = () => { this.close(); this.reject.emit(); };

        this.appRef.attachView(this.dialogRef.hostView);

        this.dialogHostEl = document.createElement('div');
        document.body.appendChild(this.dialogHostEl);
        this.dialogHostEl.appendChild(this.dialogRef.location.nativeElement);
    }

    close(): void {
        if (this.dialogRef) {
            this.appRef.detachView(this.dialogRef.hostView);
            this.dialogRef.destroy();
            this.dialogRef = null;
        }
        if (this.dialogHostEl) {
            document.body.removeChild(this.dialogHostEl);
            this.dialogHostEl = null;
        }
    }

    ngOnDestroy(): void {
        this.close();
    }
}