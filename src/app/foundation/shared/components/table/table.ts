import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  computed,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ConfirmationService,
  FilterMetadata,
  FilterOperator,
  MenuItem,
  MessageService
} from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { Menu } from 'primeng/menu';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, debounceTime } from 'rxjs';

import { DialogShellComponent } from '../dialog-shell';
import { SharedToolbarComponent } from '../toolbar/shared-toolbar.component';
import { FilterComponent } from '../filter/filter.component';
import { Card } from '../card/card';
import { CapitalizePipe } from '../../pipes/capitalize.pipe';
import { SeverityPipe } from '../../pipes/severity.pipe';

import {
  TableColumn,
  ToolbarFilterDefinition,
  AdvancedFilterState,
  BottomBarAction
} from '../../models/table.models';
import {
  generateRowId,
  resolveFilterType,
  defaultMatchMode,
  emptyFilterState,
  hasRuleValue,
  normalizeRuleValue,
  getRowId
} from '../../utils/table.utils';
import {
  TEXT_MATCH_MODES,
  NUMERIC_MATCH_MODES,
  DATE_MATCH_MODES,
  BOOLEAN_MATCH_MODES
} from '../../utils/match-modes.constants';
import { SharedBottomBarComponent } from '../bottom-bar/shared-bottombar.component';

// Re-export so consumers can import from a single location
export type { TableColumn, ToolbarFilterDefinition, BottomBarAction };

export interface CustomAction {
  key: string;
  icon: string;
  tooltip?: string;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

@Component({
  selector: 'app-table',
  standalone: true,
  // ✅ PERF #1 — OnPush: Angular بيعمل check بس لما signal أو @Input يتغير
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    MultiSelectModule,
    SliderModule,
    ProgressBarModule,
    RatingModule,
    TooltipModule,
    PopoverModule,
    CheckboxModule,
    DataViewModule,
    Menu,
    TranslocoModule,
    DialogShellComponent,
    SharedToolbarComponent,
    FilterComponent,
    SharedBottomBarComponent,
    CapitalizePipe,
    SeverityPipe,
    Card
  ],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  providers: [MessageService, ConfirmationService]
})
export class TableComponent implements OnInit, OnChanges, AfterContentInit {
  private readonly LIST_FILTER_SYNC_DELAY_MS = 0;

  // ── Inputs ────────────────────────────────────────────────────────────────

  @Input() title = 'Items';
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() rows = 10;
  @Input() loading = false;
  @Input() dataKey: string = 'id';

  // Toolbar
  @Input() showToolbar = true;
  @Input() toolbarHasFilters = true;
  @Input() toolbarShowAdd = true;
  @Input() toolbarShowSearch = true;
  @Input() toolbarShowBuiltInSearch = true;
  @Input() toolbarShowClearButton = true;
  @Input() toolbarSearchPlaceholder = '';
  @Input() toolbarFilters: ToolbarFilterDefinition[] = [];

  // Columns / actions
  @Input() showActions = true;
  @Input() showView = false;
  @Input() useExternalForm = false;
  @Input() statusOptions: { label: string; value: string }[] = [];
  @Input() severityMap: Record<
    string,
    'success' | 'warn' | 'danger' | 'info' | 'secondary'
  > | null = null;
  @Input() customActions: CustomAction[] = [];
  @Input() rowActions: ((item: any) => MenuItem[]) | null = null;
  @Input() bulkActions: BottomBarAction[] = [];
  @Input() showBulkDelete = true;
  @Input() extraColMenuItems: ((col: TableColumn) => MenuItem[]) | null = null;

  // Layout toggle
  @Input() showLayoutToggle = false;
  /** أقل عرض للكارد — بيتحكم في عدد الأعمدة أوتوماتيك
   *  مثال: '300px' → 1 عمود موبايل / 2 تابلت / 3-4 لاب توب
   */
  @Input() cardMinWidth = '300px';
  /** عدد الـ fields اللي بتظهر في الـ card body (default 7) */
  @Input() cardMaxFields = 7;

  // ✅ PERF: cached map بدل O(n) slice+filter على كل render
  private _cardFieldIndexCache = new Map<string, number>();
  private _cardFieldIndexCacheKey = '';

  getCardFieldIndex(col: TableColumn, colIndex: number): number {
    const cols = this.exportColumns();
    const cacheKey = cols.map((c) => c.field).join(',');
    if (cacheKey !== this._cardFieldIndexCacheKey) {
      this._cardFieldIndexCache.clear();
      this._cardFieldIndexCacheKey = cacheKey;
      let bodyIdx = 0;
      cols.forEach((c, i) => {
        if (i !== 0 && c.type !== 'status' && !c.isStatus) {
          this._cardFieldIndexCache.set(c.field, bodyIdx++);
        }
      });
    }
    return this._cardFieldIndexCache.get(col.field) ?? 0;
  }

  // ── Outputs ───────────────────────────────────────────────────────────────

  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() bulkDelete = new EventEmitter<any[]>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() onView = new EventEmitter<any>();
  @Output() onNew = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() customAction = new EventEmitter<{ key: string; item: any }>();
  @Output() bulkAction = new EventEmitter<string>();
  /** بيبعت الداتا المفلترة الحالية بعد كل تغيير في الفلتر */
  @Output() filteredDataChange = new EventEmitter<any[]>();

  // ── Toolbar pass-through outputs ──────────────────────────────────────────
  @Output() onExport = new EventEmitter<void>();
  @Output() onExportPdf = new EventEmitter<void>();
  @Output() onImport = new EventEmitter<void>();
  @Output() onDownloadTemplate = new EventEmitter<void>();

  // ── ViewChild / ContentChild ──────────────────────────────────────────────

  @ViewChild('dt') dt!: Table;
  @ViewChild('rowMenu') rowMenu!: Menu;
  @ViewChild('sharedHeaderPopover') sharedHeaderPopover!: any;
  @ContentChild('actionTemplate') actionTemplate!: TemplateRef<any>;
  @ContentChild('cardTemplate') cardTemplate!: TemplateRef<any>;

  // ── Services ──────────────────────────────────────────────────────────────

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private t = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // ── State ─────────────────────────────────────────────────────────────────

  items = signal<any[]>([]);
  private originalItems: any[] = []; // الترتيب الأصلي قبل أي sort
  /** Always reflects the currently-filtered rows — shared by p-table AND DataView. */
  filteredItems = signal<any[]>([]);
  layout = signal<'list' | 'grid'>('list');
  hasCardTemplate = signal(false);

  searchValue = '';
  currentItem: Record<string, unknown> = {};
  dialogVisible = false;
  dialogHeader = '';
  submitted = false;

  activeRowMenuItems: MenuItem[] = [];
  activeHeaderCol: TableColumn | null = null;
  activeSortField = '';
  activeSortOrder: 1 | -1 = 1;

  toolbarFilterValues: Record<string, string[]> = {};
  colFilterSelections: Record<string, string[]> = {};

  private advancedFilterState = new Map<string, AdvancedFilterState>();

  // ✅ PERF #3 — Subject للـ debounce على الـ filter يدوي (grid layout)
  // بدل ما يشتغل في كل keystroke، بيستنى 200ms بعد ما المستخدم يوقف
  private manualFilter$ = new Subject<void>();

  // ── Match-mode raw option sets (values only, no labels) ───────────────────

  readonly textMatchModeOptions = TEXT_MATCH_MODES;
  readonly numericMatchModeOptions = NUMERIC_MATCH_MODES;
  readonly dateMatchModeOptions = DATE_MATCH_MODES;
  readonly booleanMatchModeOptions = BOOLEAN_MATCH_MODES;

  readonly booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  // ── Lang signal — drives all translated computed() ────────────────────────
  // FIX: track the active language so that computed() that call t.translate()
  // re-run when the language changes (t.translate() is not a signal itself).
  private readonly currentLang = signal(this.t.getActiveLang());

  // Signal داخلي للـ columns عشان computed() يشتغل صح
  private columnsSignal = signal<TableColumn[]>([]);

  // ✅ PERF #4 — computed() بدل getters — بيتحسب بس لما columns تتغير
  // مش في كل change detection cycle زي ما كان بيحصل قبل كده
  readonly exportColumns = computed(() => this.columnsSignal());

  readonly globalFilterFields = computed(() =>
    this.columnsSignal().map((c) => c.field)
  );

  // FIX: declare currentLang() dependency so this reruns on lang change
  readonly pageReportTemplate = computed(() => {
    this.currentLang();
    return this.t.translate('shared.table.showingRecords', {
      title: this.title
    });
  });

  // FIX: declare currentLang() dependency so this reruns on lang change
  readonly operatorOptions = computed(() => {
    this.currentLang();
    return [
      { label: this.t.translate('shared.table.matchAll'), value: 'and' },
      { label: this.t.translate('shared.table.matchAny'), value: 'or' }
    ];
  });

  // FIX: was a plain readonly property translated once at class init time,
  // before translations were loaded, and never updated on lang change.
  // Now a computed() that reruns whenever currentLang() changes.
  readonly simpleTextModeOptions = computed(() => {
    this.currentLang();
    return ['contains', 'startsWith', 'endsWith', 'equals'].map((v) => ({
      value: v,
      label: this.t.translate(`shared.filterModes.${v}`) || v
    }));
  });

  // ── Auto-enum detection ────────────────────────────────────────────────────
  // لو الـ column عنده distinct values أقل من أو يساوي الحد ده، بنعرضه كـ checkboxes
  private readonly AUTO_ENUM_THRESHOLD = 5;

  // computed بيحسب الـ distinct values لكل field من الـ data
  readonly distinctValuesMap = computed(() => {
    const map = new Map<string, string[]>();
    const cols = this.columnsSignal();
    const data = this.items();
    for (const col of cols) {
      if (
        col.filterOptions?.length ||
        col.type === 'status' ||
        col.type === 'date' ||
        col.type === 'boolean'
      )
        continue;
      const vals = [
        ...new Set(
          data
            .map((item) => String(item[col.field] ?? ''))
            .filter((v) => v !== '')
        )
      ];
      map.set(col.field, vals);
    }
    return map;
  });

  // helper: هل الـ column يتعامل كـ auto-enum؟
  isAutoEnum(col: TableColumn): boolean {
    if (
      col.filterOptions?.length ||
      col.type === 'status' ||
      col.type === 'date' ||
      col.type === 'boolean'
    )
      return false;
    const vals = this.distinctValuesMap().get(col.field) ?? [];
    return vals.length > 0 && vals.length <= this.AUTO_ENUM_THRESHOLD;
  }

  getAutoEnumValues(col: TableColumn): string[] {
    return this.distinctValuesMap().get(col.field) ?? [];
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.originalItems = [...this.data];
    this.items.set(this.data);
    this.filteredItems.set(this.data);
    this.columnsSignal.set(this.columns);

    // FIX: keep currentLang in sync so all computed() depending on it rerun,
    // and bust the match-mode cache so getMatchModeOptionsForCol() retranslates.
    this.t.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.currentLang.set(lang);
        this._matchModeCache.clear();
        this.cdr.markForCheck();
      });

    this.manualFilter$
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._runManualFilter());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ✅ FIX: columnsSignal لازم يتحدث الأول عشان globalFilterFields() يشتغل صح
    // لو columns و data جايين مع بعض في نفس الـ change detection cycle
    if (changes['columns']) {
      this.columnsSignal.set(this.columns);
    }

    if (changes['data']) {
      this.originalItems = [...this.data];
      this.items.set(this.data);

      // ✅ FIX: في الـ grid layout، بنعمل filter يدوي فوراً بدل debounce
      // عشان الكاردز تظهر كلها على طول من غير ضغطة تانية
      if (this.layout() === 'grid') {
        const allFields = new Set([
          ...this.toolbarFilters.map((f) => f.field),
          ...this.columns
            .filter((c) => c.filterOptions?.length)
            .map((c) => c.field),
          ...this.columns.filter((c) => c.type === 'status').map((c) => c.field)
        ]);
        const result = this.applyManualFilter(allFields);
        this.filteredItems.set(result);
        this.filteredDataChange.emit(result);
      } else {
        this.filteredItems.set(this.data);
      }

      this.cdr.markForCheck();
    }
  }

  ngAfterContentInit(): void {
    this.hasCardTemplate.set(!!this.cardTemplate);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  selectedItems: any[] | null = null;

  onSelectionChange(value: any[] | null): void {
    this.selectedItems = value;
    this.selectionChange.emit(value ?? []);
    this.cdr.markForCheck();
  }

  get hasSelection(): boolean {
    return !!this.selectedItems?.length;
  }

  get selectionCount(): number {
    return this.selectedItems?.length ?? 0;
  }

  clearSelection(): void {
    this.selectedItems = null;
    this.cdr.markForCheck();
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  toggleLayout(): void {
    this.setLayout(this.layout() === 'list' ? 'grid' : 'list');
  }

  setLayout(nextLayout: 'list' | 'grid'): void {
    this.layout.set(nextLayout);

    if (nextLayout === 'list') {
      setTimeout(
        () => this.onToolbarFilterChange(),
        this.LIST_FILTER_SYNC_DELAY_MS
      );
      return;
    }

    // ✅ FIX: لما بنروح لـ grid، نعمل filter فوراً بدل استنى الـ debounce (200ms)
    // عشان الكاردز تظهر على طول بدون تأخير أو ضغطة تانية
    const allFields = new Set([
      ...this.toolbarFilters.map((f) => f.field),
      ...this.columns
        .filter((c) => c.filterOptions?.length)
        .map((c) => c.field),
      ...this.columns.filter((c) => c.type === 'status').map((c) => c.field)
    ]);
    const result = this.applyManualFilter(allFields);
    this.filteredItems.set(result);
    this.filteredDataChange.emit(result);
    this.cdr.markForCheck();
  }

  // ── Match-mode options ─────────────────────────────────────────────────────

  getMatchModeOptions(col: TableColumn): { label: string; value: string }[] {
    const type = resolveFilterType(col);
    const raw =
      type === 'numeric'
        ? this.numericMatchModeOptions
        : type === 'date'
          ? this.dateMatchModeOptions
          : type === 'boolean'
            ? this.booleanMatchModeOptions
            : this.textMatchModeOptions;
    return raw.map((o) => ({
      value: o.value,
      label: this.t.translate(`shared.filterModes.${o.value}`)
    }));
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  sortColumn(col: TableColumn, order: 1 | -1): void {
    this.activeSortField = col.field;
    this.activeSortOrder = order;
    if (!this.dt) return;
    this.dt.sort({ field: col.field, order });
  }

  clearSort(): void {
    this.activeSortField = '';
    this.activeSortOrder = 1;
    if (!this.dt) return;
    const t = this.dt as any;
    t.sortField = null;
    t.sortOrder = 1;
    t._sortOrder = 1;
    t._sortField = null;
    this.items.set([...this.originalItems]);
    this.cdr.markForCheck();
  }

  isSortable(col: TableColumn): boolean {
    return col.sortable !== false;
  }

  isFilterable(col: TableColumn): boolean {
    return col.filterable !== false;
  }

  canShowHeaderActions(col: TableColumn): boolean {
    return this.isSortable(col) || this.isFilterable(col);
  }

  isColumnSorted(col: TableColumn): boolean {
    return this.activeSortField === col.field;
  }

  getSortIcon(col: TableColumn): string {
    if (this.activeSortField !== col.field) return '';
    return this.activeSortOrder === 1
      ? 'pi-sort-amount-up-alt'
      : 'pi-sort-amount-down-alt';
  }

  getSortAscIcon(col: TableColumn): string {
    return this.activeSortField === col.field && this.activeSortOrder === 1
      ? 'pi pi-check'
      : 'pi pi-sort-amount-up-alt';
  }

  getSortDescIcon(col: TableColumn): string {
    return this.activeSortField === col.field && this.activeSortOrder === -1
      ? 'pi pi-check'
      : 'pi pi-sort-amount-down-alt';
  }

  getFilterType(col: TableColumn): string {
    return resolveFilterType(col);
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearchChanged(value: string): void {
    this.searchValue = value;

    if (this.layout() === 'grid') {
      // ✅ PERF #8 — debounce بدل immediate filter في كل keystroke
      this.manualFilter$.next();
      return;
    }

    this.dt?.filterGlobal(value, 'contains');
    this.syncFilteredItems();
  }

  onClearSearch(): void {
    this.searchValue = '';

    const fields = new Set([
      ...Object.keys(this.toolbarFilterValues),
      ...this.toolbarFilters.map((f) => f.field),
      ...this.columns
        .filter((c) => c.filterOptions?.length)
        .map((c) => c.field),
      ...this.columns.filter((c) => c.type === 'status').map((c) => c.field)
    ]);

    const cleared: Record<string, string[]> = {};
    fields.forEach((k) => (cleared[k] = []));

    this.toolbarFilterValues = cleared;
    this.colFilterSelections = { ...cleared };

    this.advancedFilterState.clear();
    this.activeSortField = '';
    this.activeSortOrder = 1;
    this.dt?.clear();
    this.filteredItems.set(this.items());
  }

  // ── Toolbar filter ────────────────────────────────────────────────────────

  onToolbarFilterChange(): void {
    const allFields = new Set([
      ...this.toolbarFilters.map((f) => f.field),
      ...this.columns
        .filter((c) => c.filterOptions?.length)
        .map((c) => c.field),
      ...this.columns.filter((c) => c.type === 'status').map((c) => c.field)
    ]);

    // Grid layout: p-table مش في الـ DOM — filter يدوي مع debounce
    if (this.layout() === 'grid') {
      this.manualFilter$.next();
      return;
    }

    // List layout: delegate to p-table
    if (!this.dt) {
      setTimeout(
        () => this.onToolbarFilterChange(),
        this.LIST_FILTER_SYNC_DELAY_MS
      );
      return;
    }

    for (const field of allFields) {
      const values = this.toolbarFilterValues[field] ?? [];
      const toolbarDef = this.toolbarFilters.find((f) => f.field === field);
      const matchMode = toolbarDef?.matchMode ?? 'in';

      this.dt.filter(
        !values.length ? null : matchMode === 'in' ? values : values[0],
        field,
        matchMode
      );
    }

    this.syncFilteredItems();
  }

  /**
   * ✅ PERF #9 — applyManualFilter: مفيش تغيير في الـ logic لكنه
   * بقى يشتغل بس من خلال debounce (manualFilter$) بدل ما يتستدعى مباشرة.
   * الـ globalFilterFields بقت computed() فمش بتتحسب في كل call.
   */
  private _runManualFilter(): void {
    const allFields = new Set([
      ...this.toolbarFilters.map((f) => f.field),
      ...this.columns
        .filter((c) => c.filterOptions?.length)
        .map((c) => c.field),
      ...this.columns.filter((c) => c.type === 'status').map((c) => c.field)
    ]);
    const result = this.applyManualFilter(allFields);
    this.filteredItems.set(result);
    this.filteredDataChange.emit(result);
  }

  private applyManualFilter(fields: Set<string>): any[] {
    const search = this.searchValue.toLowerCase();
    // ✅ fallback: لو columnsSignal لسه فاضي، نستخدم this.columns مباشرة
    const filterFields = this.globalFilterFields().length
      ? this.globalFilterFields()
      : this.columns.map((c) => c.field);

    return this.items().filter((item) => {
      if (search) {
        const matchesSearch = filterFields.some((f) =>
          String(item[f] ?? '')
            .toLowerCase()
            .includes(search)
        );
        if (!matchesSearch) return false;
      }

      for (const field of fields) {
        const values = this.toolbarFilterValues[field] ?? [];
        if (!values.length) continue;

        const toolbarDef = this.toolbarFilters.find((f) => f.field === field);
        const matchMode = toolbarDef?.matchMode ?? 'in';
        const cellValue = String(item[field] ?? '');

        if (matchMode === 'in' && !values.includes(cellValue)) return false;
        if (matchMode === 'equals' && cellValue !== values[0]) return false;
        if (matchMode === 'contains' && !cellValue.includes(values[0]))
          return false;
      }

      return true;
    });
  }

  // ── Column header popover ─────────────────────────────────────────────────

  openHeaderPopover(event: MouseEvent, col: TableColumn): void {
    event.stopPropagation();

    const isSameCol = this.activeHeaderCol?.field === col.field;
    this.activeHeaderCol = col;
    this.ensureFilterState(col);

    if (
      col.filterOptions?.length ||
      col.type === 'status' ||
      this.isAutoEnum(col)
    ) {
      this.colFilterSelections[col.field] = [
        ...(this.toolbarFilterValues[col.field] ?? [])
      ];
    }

    const target = event.currentTarget ?? event.target;

    if (!isSameCol && this.sharedHeaderPopover?.overlayVisible) {
      // كولم مختلف والـ popover مفتوح → نقفله الأول ثم نفتحه على الجديد
      this.sharedHeaderPopover.hide();
      setTimeout(() => {
        this.activeHeaderCol = col;
        this.cdr.markForCheck();
        setTimeout(() => this.sharedHeaderPopover?.show(event, target));
      }, 50);
    } else {
      setTimeout(() => {
        this.cdr.markForCheck();
        this.sharedHeaderPopover?.show(event, target);
      });
    }
  }

  applyColumnFilter(col: TableColumn, popover: any): void {
    if (!this.dt) return;
    const state = this.ensureFilterState(col);

    const validRules = state.rules.filter((r) => {
      const v = r.value;
      return v !== null && v !== undefined && String(v).trim() !== '';
    });

    popover?.hide();

    if (!validRules.length) {
      this.dt.filter(null, col.field, 'contains');
      setTimeout(() => {
        this.syncFilteredItems();
        this.cdr.markForCheck();
      });
      return;
    }

    if (validRules.length === 1) {
      this.dt.filter(
        String(validRules[0].value).trim(),
        col.field,
        validRules[0].matchMode as any
      );
    } else {
      const tableAny = this.dt as any;
      tableAny.filters = {
        ...tableAny.filters,
        [col.field]: {
          operator:
            state.operator === 'or' ? FilterOperator.OR : FilterOperator.AND,
          constraints: validRules.map((r) => ({
            value: String(r.value).trim(),
            matchMode: r.matchMode
          }))
        }
      };
      (tableAny as any)._filter?.();
    }

    setTimeout(() => {
      this.syncFilteredItems();
      this.cdr.markForCheck();
    });
  }

  clearColumnFilter(col: TableColumn, popover: any): void {
    const state = this.ensureFilterState(col);
    state.operator = 'and';
    state.rules = [{ matchMode: defaultMatchMode(col), value: null }];

    popover?.hide();
    this.dt?.filter(null, col.field, 'contains');
    setTimeout(() => {
      this.syncFilteredItems();
      this.cdr.markForCheck();
    });
  }

  applyColFilterOptions(col: TableColumn, popover: any): void {
    this.toolbarFilterValues[col.field] = [
      ...(this.colFilterSelections[col.field] ?? [])
    ];
    this.onToolbarFilterChange();
    popover?.hide();
  }

  clearColFilterOptions(col: TableColumn, popover: any): void {
    this.colFilterSelections[col.field] = [];
    this.toolbarFilterValues[col.field] = [];
    this.onToolbarFilterChange();
    popover?.hide();
  }

  hasColFilterOptionsActive(col: TableColumn): boolean {
    return (this.toolbarFilterValues[col.field] ?? []).length > 0;
  }

  addFilterRule(col: TableColumn): void {
    this.ensureFilterState(col).rules.push({
      matchMode: defaultMatchMode(col),
      value: null
    });
  }

  removeFilterRule(col: TableColumn, index: number): void {
    const state = this.ensureFilterState(col);
    if (state.rules.length <= 1) {
      state.rules[0] = { matchMode: defaultMatchMode(col), value: null };
    } else {
      state.rules.splice(index, 1);
    }
  }

  getFilterState(col: TableColumn): AdvancedFilterState {
    return this.ensureFilterState(col);
  }

  onHeaderPopoverOpen(col: TableColumn): void {
    this.ensureFilterState(col);
  }

  // ✅ PERF: memoized per column type — مش بيترجم من جديد كل فتح popover.
  // FIX: cache is cleared in ngOnInit's langChanges$ subscription so labels
  // are retranslated after a language switch.
  private _matchModeCache = new Map<
    string,
    { label: string; value: string }[]
  >();

  getMatchModeOptionsForCol(
    col: TableColumn
  ): { label: string; value: string }[] {
    const type = resolveFilterType(col);
    if (this._matchModeCache.has(type)) return this._matchModeCache.get(type)!;

    const raw =
      type === 'numeric'
        ? this.numericMatchModeOptions
        : type === 'date'
          ? this.dateMatchModeOptions
          : type === 'boolean'
            ? this.booleanMatchModeOptions
            : this.textMatchModeOptions;

    const result = raw.map((o) => ({
      value: o.value,
      label: this.t.translate(`shared.filterModes.${o.value}`)
    }));
    this._matchModeCache.set(type, result);
    return result;
  }

  // ── CRUD actions ──────────────────────────────────────────────────────────

  openNew(): void {
    if (this.useExternalForm) {
      this.onNew.emit();
      return;
    }
    this.currentItem = {};
    this.submitted = false;
    this.dialogHeader = `Create New ${this.title.slice(0, -1)}`;
    this.dialogVisible = true;
  }

  editItem(item: unknown): void {
    if (this.useExternalForm) {
      this.onEdit.emit(item);
      return;
    }
    this.currentItem =
      item && typeof item === 'object'
        ? { ...(item as Record<string, unknown>) }
        : {};
    this.submitted = false;
    this.dialogHeader = `Edit ${this.title.slice(0, -1)}`;
    this.dialogVisible = true;
  }

  hideDialog(): void {
    this.dialogVisible = false;
    this.submitted = false;
  }

  saveItem(): void {
    this.submitted = true;
    if (
      !this.currentItem['name'] &&
      this.columns.some((c) => c.field === 'name')
    )
      return;

    const id = getRowId(this.currentItem);
    if (id !== null) {
      const idx = this.items().findIndex((i) => getRowId(i) === id);
      const updated = [...this.items()];
      if (idx !== -1) updated[idx] = this.currentItem;
      this.items.set(updated);
    } else {
      this.currentItem['id'] = generateRowId();
      this.items.set([...this.items(), this.currentItem]);
    }

    this.save.emit(this.currentItem);
    this.toast('success', `${this.title.slice(0, -1)} Saved`);
    this.dialogVisible = false;
    this.currentItem = {};
  }

  confirmDelete(item: unknown): void {
    this.confirmationService.confirm({
      message:
        this.t.translate('shared.table.confirmDelete') || 'Delete this item?',
      header:
        this.t.translate('shared.table.confirmDeleteHeader') ||
        'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.t.translate('shared.common.delete') || 'Delete',
      rejectLabel: this.t.translate('shared.common.cancel') || 'Cancel',
      accept: () => this.deleteItem(item)
    });
  }

  deleteItem(item: unknown): void {
    const id = getRowId(item);
    this.items.set(this.items().filter((v) => getRowId(v) !== id));
    this.delete.emit(item);
    this.toast('success', `${this.title.slice(0, -1)} Deleted`);
  }

  deleteSelectedItems(): void {
    if (!this.selectedItems?.length) return;
    const sel = this.selectedItems;
    this.items.set(this.items().filter((v) => !sel.includes(v)));
    this.bulkDelete.emit(sel);
    this.selectedItems = null;
    this.cdr.markForCheck();
    this.toast('success', this.t.translate('toast.itemsDeleted'));
  }

  // ── Row menu ──────────────────────────────────────────────────────────────

  _hoverPanelActive = false;

  hasCardFooterContent(item: any): boolean {
    if (item['tags']) return true;
    return this.exportColumns().some(
      (col) => col.type === 'date' && this.isValidDate(item[col.field])
    );
  }

  /** Guard against placeholder values like "—" that the API sends instead of null */
  isValidDate(value: unknown): boolean {
    if (!value || typeof value === 'boolean') return false;
    const s = String(value).trim();
    if (
      !s ||
      s === '—' ||
      s === '-' ||
      s === 'N/A' ||
      s === 'null' ||
      s === 'undefined'
    )
      return false;
    const d = new Date(s);
    return !isNaN(d.getTime());
  }

  openRowMenu(event: MouseEvent, item: unknown): void {
    if (!this.rowActions) return;
    this.activeRowMenuItems = this.rowActions(item);
    this.rowMenu.model = this.activeRowMenuItems;
    this.rowMenu.toggle(event);
  }

  // ── Misc ──────────────────────────────────────────────────────────────────

  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  clearFilters(table: Table): void {
    table.clear();
  }

  onCustomAction(key: string, item: unknown): void {
    this.customAction.emit({ key, item });
  }

  viewItem(item: unknown): void {
    this.onView.emit(item);
  }

  exportCSV(): void {
    if (this.dt && this.columns?.length) {
      this.dt.exportCSV();
      this.toast('success', this.t.translate('shared.toolbar.export'));
    } else {
      this.toast('error', 'Export Failed — table or columns missing');
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private ensureFilterState(col: TableColumn): AdvancedFilterState {
    if (!this.advancedFilterState.has(col.field)) {
      this.advancedFilterState.set(col.field, emptyFilterState(col));
    }
    return this.advancedFilterState.get(col.field)!;
  }

  // ✅ PERF: debounced sync — لو اتكلمت أكتر من مرة في نفس الـ tick، بتنفذ مرة واحدة بس
  private _syncPending = false;
  private syncFilteredItems(): void {
    if (this._syncPending) return;
    this._syncPending = true;
    setTimeout(() => {
      this._syncPending = false;
      const filtered = (this.dt as any)?.filteredValue;
      const result = filtered ?? this.items();
      this.filteredItems.set(result);
      this.filteredDataChange.emit(result);
      this.cdr.markForCheck();
    }, 0);
  }

  private runFilterCycle(): void {
    if (!this.dt) return;
    const t = this.dt as any;
    if (typeof t._filter === 'function') {
      t._filter();
    } else {
      this.dt.filterGlobal(this.searchValue || '', 'contains');
    }
  }

  private toast(severity: 'success' | 'error' | 'info', detail: string): void {
    this.messageService.add({
      severity,
      summary: this.t.translate('shared.toast.success'),
      detail,
      life: 3000
    });
  }
}
