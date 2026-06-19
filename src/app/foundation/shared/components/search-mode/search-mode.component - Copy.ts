import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

export type SearchMode = 'basic' | 'sql' | 'ai';

@Component({
  selector: 'app-search-mode',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TranslocoModule
  ],
  template: `
    <div class="flex flex-col w-full gap-2 min-w-0">
      <!-- Search row: mode switcher + active mode input -->
      <div class="flex items-start gap-2 min-w-0">
        <div
          *ngIf="availableModes.length > 1"
          class="flex items-center gap-1 shrink-0"
        >
          <p-button
            *ngIf="availableModes.includes('basic')"
            icon="pi pi-globe"
            [severity]="mode === 'basic' ? 'primary' : 'secondary'"
            [outlined]="mode !== 'basic'"
            [pTooltip]="'shared.searchMode.basic' | transloco"
            tooltipPosition="top"
            (onClick)="setMode('basic')"
          />
          <p-button
            *ngIf="availableModes.includes('sql')"
            icon="pi pi-code"
            [severity]="mode === 'sql' ? 'primary' : 'secondary'"
            [outlined]="mode !== 'sql'"
            [pTooltip]="'shared.searchMode.sql' | transloco"
            tooltipPosition="top"
            (onClick)="setMode('sql')"
          />
          <p-button
            *ngIf="availableModes.includes('ai')"
            icon="pi pi-sparkles"
            [severity]="mode === 'ai' ? 'primary' : 'secondary'"
            [outlined]="mode !== 'ai'"
            [pTooltip]="'shared.searchMode.ai' | transloco"
            tooltipPosition="top"
            (onClick)="setMode('ai')"
          />
        </div>

        <!-- Basic mode -->
        <div
          *ngIf="mode === 'basic' && showBuiltInSearch"
          class="flex-1 min-w-0"
        >
          <p-iconfield class="w-full">
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              [(ngModel)]="searchValue"
              (input)="onSearchInput($event)"
              (keydown.enter)="searchChanged.emit(searchValue)"
              [placeholder]="searchPlaceholder"
              class="h-9 w-full!"
            />
          </p-iconfield>
        </div>

        <!-- SQL mode -->
        <div
          *ngIf="mode === 'sql'"
          class="flex-1 min-w-0 flex items-start gap-2"
        >
          <textarea
            pTextarea
            rows="3"
            [(ngModel)]="sqlValue"
            (ngModelChange)="sqlValueChange.emit($event)"
            (keydown)="onTextareaKeydown($event, 'sql')"
            [placeholder]="
              sqlPlaceholder || ('shared.searchMode.sqlPlaceholder' | transloco)
            "
            class="w-full! font-mono resize-none"
          ></textarea>
          <p-button
            icon="pi pi-search"
            severity="primary"
            [pTooltip]="'shared.searchMode.sql' | transloco"
            tooltipPosition="top"
            (onClick)="sqlSearch.emit(sqlValue)"
          />
        </div>

        <!-- AI mode -->
        <div
          *ngIf="mode === 'ai'"
          class="flex-1 min-w-0 flex items-start gap-2"
        >
          <textarea
            pTextarea
            rows="3"
            [(ngModel)]="aiValue"
            (ngModelChange)="aiValueChange.emit($event)"
            (keydown)="onTextareaKeydown($event, 'ai')"
            [placeholder]="
              aiPlaceholder || ('shared.searchMode.aiPlaceholder' | transloco)
            "
            class="w-full! resize-none"
          ></textarea>
          <p-button
            icon="pi pi-sparkles"
            severity="primary"
            [pTooltip]="'shared.searchMode.ai' | transloco"
            tooltipPosition="top"
            (onClick)="aiSearch.emit(aiValue)"
          />
        </div>
      </div>

      <!-- Filters row: only for basic mode -->
      <div *ngIf="mode === 'basic'" class="flex items-center gap-2 flex-wrap">
        <ng-content />

        <p-button
          *ngIf="showClearButton"
          severity="primary"
          icon="pi pi-filter-slash"
          [label]="'shared.common.clear' | transloco"
          [outlined]="false"
          [text]="true"
          [pTooltip]="'shared.toolbar.clearFilters' | transloco"
          tooltipPosition="top"
          (onClick)="handleClear()"
          class="h-9"
        />
      </div>
    </div>
  `
})
export class SearchModeComponent {
  @Input() mode: SearchMode = 'basic';
  @Input() availableModes: SearchMode[] = ['basic', 'sql', 'ai'];
  @Output() modeChange = new EventEmitter<SearchMode>();

  @Input() searchValue = '';
  @Input() searchPlaceholder = '';
  @Input() showBuiltInSearch = true;
  @Input() showClearButton = true;
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();

  @Input() sqlValue = '';
  @Input() sqlPlaceholder = '';
  @Output() sqlValueChange = new EventEmitter<string>();
  @Output() sqlSearch = new EventEmitter<string>();

  @Input() aiValue = '';
  @Input() aiPlaceholder = '';
  @Output() aiValueChange = new EventEmitter<string>();
  @Output() aiSearch = new EventEmitter<string>();

  setMode(mode: SearchMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.modeChange.emit(mode);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.searchValueChange.emit(value);
    this.searchChanged.emit(value);
  }

  onTextareaKeydown(event: KeyboardEvent, mode: 'sql' | 'ai'): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (mode === 'sql') {
      this.sqlSearch.emit(this.sqlValue);
    } else {
      this.aiSearch.emit(this.aiValue);
    }
  }

  handleClear(): void {
    this.searchValue = '';
    this.searchValueChange.emit('');
    this.searchChanged.emit('');
    this.clearSearch.emit();
  }
}
