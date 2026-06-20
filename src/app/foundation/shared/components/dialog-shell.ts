import {
    Component,
    Input,
    Output,
    EventEmitter,
    ContentChild,
    TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-dialog-shell',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, TranslocoModule],
    template: `
        <p-dialog
            [(visible)]="visible"
            (visibleChange)="visibleChange.emit($event)"
            [header]="header"
            [modal]="true"
            [dismissableMask]="dismissableMask"
            [draggable]="draggable"
            [resizable]="resizable"
            [blockScroll]="blockScroll"
            [showHeader]="showHeader"
            [closable]="closable"
            [appendTo]="appendTo"
            [baseZIndex]="baseZIndex"
            [style]="style"
            [styleClass]="'app-dialog-md p-fluid ' + styleClass"
            [breakpoints]="breakpoints"
            (onHide)="onHide.emit()"
        >
            <ng-container
                *ngIf="contentTemplate"
                [ngTemplateOutlet]="contentTemplate"
            />
            <ng-content *ngIf="!contentTemplate" />

            @if (!hideFooter) {
                <ng-template pTemplate="footer">
                    <ng-container
                        *ngIf="footerTemplate; else defaultFooter"
                        [ngTemplateOutlet]="footerTemplate"
                    />
                    <ng-template #defaultFooter>
                        <div class="flex justify-end gap-2">
                            <p-button
                                [label]="'shared.common.cancel' | transloco"
                                severity="secondary"
                                (onClick)="cancel()"
                            />
                            <p-button
                                [label]="'shared.common.save' | transloco"
                                icon="pi pi-check"
                                [disabled]="saveDisabled"
                                (onClick)="save.emit()"
                            />
                        </div>
                    </ng-template>
                </ng-template>
            }
        </p-dialog>
    `
})
export class DialogShellComponent {
    @Input() breakpoints: Record<string, string> = {
        '960px': '75vw',
        '641px': '90vw'
    };
    @Input() dismissableMask = true;
    @Input() visible = false;
    @Input() header = '';
    @Input() saveDisabled = false;
    @Input() styleClass = '';
    @Input() style: Record<string, string> = { width: '450px' };
    @Input() showHeader = true;
    @Input() closable = true;
    @Input() draggable = false;
    @Input() resizable = false;
    @Input() blockScroll = false;
    @Input() appendTo: string = 'body';
    @Input() baseZIndex = 0;
    @Input() hideFooter = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();
    @Output() onHide = new EventEmitter<void>();

    @ContentChild('dialogContent') contentTemplate?: TemplateRef<any>;
    @ContentChild('dialogFooter') footerTemplate?: TemplateRef<any>;

    cancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }
}