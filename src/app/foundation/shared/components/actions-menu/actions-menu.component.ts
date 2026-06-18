import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Reusable 3-dot actions menu.
 * Drop-in replacement wherever a row or card needs a popup action list.
 *
 * @example
 * <app-actions-menu [items]="rowMenuItems(item)" />
 */
@Component({
    selector: 'app-actions-menu',
    standalone: true,
    imports: [CommonModule, ButtonModule, MenuModule, TooltipModule],
    template: `
        <p-button
            icon="pi pi-ellipsis-v"
            severity="secondary"
            [outlined]="outlined"
            [rounded]="rounded"
            [text]="text"
            [size]="size"
            [disabled]="disabled || !items.length"
            [pTooltip]="tooltip"
            tooltipPosition="top"
            [attr.aria-label]="ariaLabel"
            (onClick)="menu.toggle($event)"
        />
        <p-menu #menu [model]="items" [popup]="true" appendTo="body" />
    `
})
export class ActionsMenuComponent {
    @ViewChild('menu') private menu!: Menu;

    @Input() items: MenuItem[] = [];
    @Input() ariaLabel = 'Actions';
    @Input() tooltip = '';
    @Input() outlined = true;
    @Input() rounded = true;
    @Input() text = false;
    @Input() size: 'small' | 'large' | undefined = 'small';
    @Input() disabled = false;
}