import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SearchModeComponent,
  SearchMode
} from '../search-mode/search-mode.component';

@Component({
  selector: 'app-shared-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    MenuModule,
    DividerModule,
    TooltipModule,
    TranslocoModule,
    SearchModeComponent
  ],
  template: `
    <p-toolbar>
      <ng-template #start>
        <div class="flex flex-col w-full gap-2">
          <!-- Row 1: Title + Actions -->
          <div class="toolbar-title-row">
            <span class="font-bold text-xl truncate min-w-0">{{ title }}</span>

            <div class="flex items-center gap-2 shrink-0">
              <ng-content select="[toolbar-row-actions]" />

              <p-button
                *ngIf="showAdd"
                [label]="'shared.common.add' | transloco"
                icon="pi pi-plus"
                severity="primary"
                (onClick)="addClicked.emit()"
              />
              <p-button
                icon="pi pi-ellipsis-v"
                severity="secondary"
                [outlined]="true"
                [pTooltip]="'shared.toolbar.moreOptions' | transloco"
                tooltipPosition="top"
                (onClick)="menu.toggle($event)"
              />
            </div>
          </div>

          <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body" />

          <!-- Row 2: Search + Filters + Layout Toggle -->
          <ng-container *ngIf="hasFilters">
            <p-divider styleClass="my-0 border-gray-200" />

            <!-- Search mode + layout toggle row -->
            <div class="toolbar-search-row">
              <app-search-mode
                class="flex-1 min-w-0"
                [mode]="searchMode"
                [availableModes]="availableSearchModes"
                (modeChange)="onSearchModeChange($event)"
                [searchValue]="searchValue"
                [searchPlaceholder]="searchPlaceholder"
                [showBuiltInSearch]="showBuiltInSearch"
                [showClearButton]="showClearButton"
                (searchValueChange)="searchValueChange.emit($event)"
                (searchChanged)="searchChanged.emit($event)"
                (clearSearch)="clearSearch.emit()"
                [sqlValue]="sqlValue"
                [sqlPlaceholder]="sqlPlaceholder"
                (sqlValueChange)="sqlValueChange.emit($event)"
                (sqlSearch)="sqlSearch.emit($event)"
                [aiValue]="aiValue"
                [aiPlaceholder]="aiPlaceholder"
                (aiValueChange)="aiValueChange.emit($event)"
                (aiSearch)="aiSearch.emit($event)"
              >
                <ng-content select="[toolbar-filters]" />
              </app-search-mode>

              <div class="toolbar-search-right">
                <ng-container *ngIf="showLayoutToggle">
                  <div class="flex items-center gap-1 shrink-0">
                    <p-button
                      icon="pi pi-list"
                      [severity]="
                        activeLayout === 'list' ? 'primary' : 'secondary'
                      "
                      [outlined]="activeLayout !== 'list'"
                      pTooltip="Table View"
                      tooltipPosition="top"
                      (onClick)="layoutChange.emit('list')"
                    />
                    <p-button
                      icon="pi pi-th-large"
                      [severity]="
                        activeLayout === 'grid' ? 'primary' : 'secondary'
                      "
                      [outlined]="activeLayout !== 'grid'"
                      pTooltip="Cards View"
                      tooltipPosition="top"
                      (onClick)="layoutChange.emit('grid')"
                    />
                  </div>
                </ng-container>
                <ng-content select="[toolbar-extra]" />
              </div>
            </div>
          </ng-container>
        </div>
      </ng-template>
    </p-toolbar>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      :host ::ng-deep .p-toolbar-start {
        flex: 1;
        width: 100%;
        min-width: 0;
      }

      :host ::ng-deep .p-toolbar {
        border-inline-start: none;
        border-inline-end: none;
        border-top: none;
        padding-block: 0.5rem;
        padding-inline: 1rem;
      }

      :host ::ng-deep .p-toolbar:first-child {
        border-top: 1px solid var(--surface-border);
      }

      /* Title row: title shrinks, actions stay fixed */
      .toolbar-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        min-width: 0;
      }

      /* Search row: search grows, toggle stays right */
      .toolbar-search-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
        min-width: 0;
      }

      .toolbar-search-right {
        display: flex;
        align-items: center;
        gap: 8px;
        shrink: 0;
      }

      app-search-mode {
        display: block;
      }

      /* Mobile: stack search above layout toggle */
      @media (max-width: 480px) {
        .toolbar-search-row {
          flex-wrap: wrap;
        }

        app-search-mode {
          width: 100%;
          flex: 1 1 100%;
        }

        .toolbar-search-right {
          width: 100%;
          justify-content: flex-end;
        }
      }
    `
  ]
})
export class SharedToolbarComponent implements OnInit {
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() title = '';
  @Input() searchPlaceholder = 'Search…';
  @Input() searchValue = '';
  @Output() searchValueChange = new EventEmitter<string>();

  @Input() showClearButton = true;
  @Input() showBuiltInSearch = true;
  @Input() hasFilters = false;
  @Input() showAdd = false;
  @Input() currentLang: 'en' | 'ar' = 'en';
  @Input() showLayoutToggle = false;
  @Input() activeLayout: 'list' | 'grid' = 'list';

  @Input() searchMode: SearchMode = 'basic';
  @Input() availableSearchModes: SearchMode[] = ['basic', 'sql', 'ai'];
  @Output() searchModeChange = new EventEmitter<SearchMode>();

  @Input() sqlValue = '';
  @Input() sqlPlaceholder = '';
  @Output() sqlValueChange = new EventEmitter<string>();
  @Output() sqlSearch = new EventEmitter<string>();

  @Input() aiValue = '';
  @Input() aiPlaceholder = '';
  @Output() aiValueChange = new EventEmitter<string>();
  @Output() aiSearch = new EventEmitter<string>();

  /** @deprecated No-op — kept for backward compatibility. */
  @Input() hasSearch = true;
  /** @deprecated No-op — kept for backward compatibility. */
  @Input() showBulkEdit = false;

  @Output() addClicked = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() onExport = new EventEmitter<void>();
  @Output() onExportPdf = new EventEmitter<void>();
  @Output() onImport = new EventEmitter<void>();
  @Output() onDownloadTemplate = new EventEmitter<void>();
  @Output() layoutChange = new EventEmitter<'list' | 'grid'>();

  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.buildMenu();
    this.t.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.buildMenu());
  }

  onSearchModeChange(mode: SearchMode): void {
    this.searchMode = mode;
    this.searchModeChange.emit(mode);
  }

  private buildMenu(): void {
    this.menuItems = [
      {
        label: this.t.translate('shared.toolbar.export'),
        icon: 'pi pi-file-excel',
        command: () => this.onExport.emit()
      },
      {
        label: this.t.translate('shared.toolbar.exportPdf'),
        icon: 'pi pi-file-pdf',
        command: () => this.onExportPdf.emit()
      },
      {
        label: this.t.translate('shared.toolbar.downloadTemplate'),
        icon: 'pi pi-download',
        command: () => this.onDownloadTemplate.emit()
      },
      { separator: true },
      {
        label: this.t.translate('shared.toolbar.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport.emit()
      }
    ];
  }
}
