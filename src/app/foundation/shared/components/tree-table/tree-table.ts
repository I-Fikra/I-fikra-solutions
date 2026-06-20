// ══════════════════════════════════════════════════════
//  tree-table.component.ts  – v5
//
//  التغييرات عن v4:
//  - حُذف كل الـ card logic الخاص بالـ permissions
//    (cardExpandedPerms, isCardItemSelected, isCardPermIndeterminate,
//     onCardItemToggle, onCardPermToggle)
//  - الـ card layout الآن يعتمد بالكامل على:
//      • cardTemplate  → projected من الـ parent عبر <ng-template #cardTemplate>
//      • fallback default card جنريك خالي من أي domain logic
//  - كل feature (permissions / roles / إلخ) تبعت card template خاص بيها
// ══════════════════════════════════════════════════════

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { ButtonModule }           from 'primeng/button';
import { CheckboxModule }         from 'primeng/checkbox';
import { DataViewModule }         from 'primeng/dataview';
import { InputTextModule }        from 'primeng/inputtext';
import { Menu, MenuModule }       from 'primeng/menu';
import { MenuItem }               from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule }           from 'primeng/select';
import { TableModule }            from 'primeng/table';
import { TagModule }              from 'primeng/tag';
import { TooltipModule }          from 'primeng/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { SharedToolbarComponent }   from '../toolbar/shared-toolbar.component';
import { FilterComponent }          from '../filter/filter.component';
import { SharedBottomBarComponent } from '../bottom-bar/shared-bottombar.component';
import { SeverityPipe }             from '../../pipes/severity.pipe';
import { ToolbarFilterDefinition, BottomBarAction } from '../../models/table.models';

import {
  Role, TreeNode, TreeModule, TreeNodeData,
  TreeTableColumn, NestedTableConfig,
  TreeTableSortEvent, TreeTableColFilterEvent,
  PaginationConfig, ColFilterState,
} from './tree-table.models';

export type {
  Role, TreeNode, TreeModule, TreeNodeData,
  TreeTableColumn, NestedTableConfig,
  TreeTableSortEvent, TreeTableColFilterEvent,
  PaginationConfig,
};

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-tree-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree-table.component.html',
  styleUrl:    './tree-table.scss',
  imports: [
    CommonModule, FormsModule, TranslocoModule,
    TableModule, ButtonModule, TagModule, CheckboxModule,
    TooltipModule, PopoverModule, InputTextModule,
    SelectModule, MenuModule, PaginatorModule, DataViewModule,
    SharedToolbarComponent, FilterComponent,
    SharedBottomBarComponent, SeverityPipe,
  ],
})
export class TreeTableComponent implements OnChanges, AfterContentInit {

  // ── Services ────────────────────────────────────────────────────────────────
  private t          = inject(TranslocoService);
  private document   = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  readonly collapseIcon: string =
    this.document.documentElement.dir === 'rtl'
      ? 'pi pi-chevron-left'
      : 'pi pi-chevron-right';

  // ═══════════════════════════════════════════════════════
  //  INPUTS
  // ═══════════════════════════════════════════════════════

  // ── Data ────────────────────────────────────────────────────────────────────
  @Input() modules: TreeModule[]                    = [];
  @Input() sortedEntitiesMap: Map<string, TreeNode[]> = new Map();
  @Input() roleAssignments:   Map<string, string[]>  = new Map();

  // ── Expansion & selection state ─────────────────────────────────────────────
  @Input() expandedRows:           Record<string, boolean> = {};
  @Input() expandedChildRows:      Record<string, boolean> = {};
  @Input() expandedGrandchildRows: Record<string, boolean> = {};
  @Input() selectedEntities: TreeNode[] = [];
  @Input() selectedItems:    TreeNode[] = [];
  @Input() availableRoles:   Role[]     = [];

  // ── Column config ────────────────────────────────────────────────────────────
  @Input() entityColumns:      TreeTableColumn[] = [];
  @Input() childColumns:       TreeTableColumn[] = [];
  @Input() grandchildColumns:  TreeTableColumn[] = [];
  @Input() grandchildLabel  = '';
  @Input() nestedConfig?:      NestedTableConfig;
  @Input() groupByModule     = true;

  // ── Action labels ────────────────────────────────────────────────────────────
  @Input() entityActionLabel   = '';
  @Input() itemActionLabel     = '';
  @Input() entityAddChildLabel = '';
  @Input() itemAddChildLabel   = '';

  // ── Show/hide flags ──────────────────────────────────────────────────────────
  @Input() showEntityAddChild = false;
  @Input() showItemAddChild   = false;
  @Input() showItemInsert     = false;
  @Input() showItemView       = false;
  @Input() showItemAction     = false;

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  @Input() title                    = 'Items';
  @Input() showToolbar              = true;
  @Input() toolbarShowAdd           = false;
  @Input() toolbarShowBuiltInSearch = true;
  @Input() toolbarSearchPlaceholder = '';
  @Input() toolbarFilters: ToolbarFilterDefinition[] = [];

  // ── Layout / cards ───────────────────────────────────────────────────────────
  @Input() showLayoutToggle = false;
  @Input() cardGridCols     = 'grid-cols-12';
  @Input() cardColSpan      = 'col-span-12 sm:col-span-6 lg:col-span-4';
  @Input() cardRows         = 12;

  @Input() set layoutInput(value: 'list' | 'grid') {
    if (value) this.layout.set(value);
  }

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  @Input() bulkActions: BottomBarAction[] = [];
  @Input() showBulkDelete = true;

  // ── Misc ─────────────────────────────────────────────────────────────────────
  @Input() paginationConfig?: PaginationConfig;
  @Input() globalSearch = '';

  // ═══════════════════════════════════════════════════════
  //  OUTPUTS
  // ═══════════════════════════════════════════════════════

  @Output() entityEdit            = new EventEmitter<TreeNode>();
  @Output() itemEdit              = new EventEmitter<string>();
  @Output() itemInsert            = new EventEmitter<string>();
  @Output() itemView              = new EventEmitter<string>();
  @Output() itemAction            = new EventEmitter<string>();
  @Output() grandchildEdit        = new EventEmitter<string>();
  @Output() entitySelectionChange = new EventEmitter<TreeNode[]>();
  @Output() itemSelectionChange   = new EventEmitter<TreeNode[]>();
  @Output() entityAddChild        = new EventEmitter<TreeNode>();
  @Output() itemAddChild          = new EventEmitter<string>();
  @Output() colFilterChanged      = new EventEmitter<TreeTableColFilterEvent>();
  @Output() sortChanged           = new EventEmitter<TreeTableSortEvent>();
  @Output() entityDelete          = new EventEmitter<TreeNode>();
  @Output() itemDelete            = new EventEmitter<string>();
  @Output() pageChange            = new EventEmitter<PaginatorState>();
  @Output() selectionCountChange  = new EventEmitter<number>();
  @Output() addClicked            = new EventEmitter<void>();
  @Output() bulkAction            = new EventEmitter<string>();
  @Output() bulkDelete            = new EventEmitter<{ entities: TreeNode[]; items: TreeNode[] }>();

  // ═══════════════════════════════════════════════════════
  //  VIEW REFS
  // ═══════════════════════════════════════════════════════

  @ViewChild('entityRowMenu')     entityRowMenu!: Menu;
  @ViewChild('itemRowMenu')       itemRowMenu!: Menu;
  @ViewChild('grandchildRowMenu') grandchildRowMenu!: Menu;

  /**
   * Card template projected من الـ parent عبر:
   *   <ng-template #cardTemplate let-entity> ... </ng-template>
   *
   * context: { $implicit: TreeNode }
   *
   * لو مش موجود → الـ tree-table بيعرض الـ default generic card.
   * كل feature بتبعت template خاص بيها بدون ما تعدل في الـ tree-table.
   */
  @ContentChild('cardTemplate')        cardTemplate!:        TemplateRef<{ $implicit: TreeNode }>;

  /**
   * Optional projected templates for injecting extra action controls into
   * entity / child / grandchild rows.  The parent passes them like:
   *
   *   <ng-template #entityRowExtra   let-entity>...</ng-template>
   *   <ng-template #childRowExtra    let-cat let-entityKey="entityKey">...</ng-template>
   *   <ng-template #grandchildRowExtra let-sub let-entityKey="entityKey">...</ng-template>
   *
   * When present these replace the generic openEntityMenu / openItemMenu /
   * openGrandchildMenu buttons so the parent controls the action flow
   * entirely (e.g. CategoriesComponent driving its own signal-based dialogs).
   * When absent the tree-table falls back to its own p-menu buttons.
   */
  @ContentChild('entityRowExtra')      entityRowExtraTpl!:   TemplateRef<{ $implicit: TreeNode }>;
  @ContentChild('childRowExtra')       childRowExtraTpl!:    TemplateRef<{ $implicit: TreeNode; entityKey: string }>;
  @ContentChild('grandchildRowExtra')  grandchildRowExtraTpl!: TemplateRef<{ $implicit: TreeNode; entityKey: string }>;

  activeEntityMenuItems:     MenuItem[] = [];
  activeItemMenuItems:       MenuItem[] = [];
  activeGrandchildMenuItems: MenuItem[] = [];

  // ═══════════════════════════════════════════════════════
  //  REACTIVE STATE (signals)
  // ═══════════════════════════════════════════════════════

  readonly layout = signal<'list' | 'grid'>('list');

  readonly _modules           = signal<TreeModule[]>([]);
  readonly _sortedEntitiesMap = signal<Map<string, TreeNode[]>>(new Map());

  private _searchRaw$  = new Subject<string>();
  private _searchValue = signal('');

  get searchValue()            { return this._searchValue(); }
  set searchValue(v: string)   { this._searchValue.set(v); }

  private _toolbarFilterValues = signal<Record<string, string[]>>({});
  get toolbarFilterValues()    { return this._toolbarFilterValues(); }
  set toolbarFilterValues(v: Record<string, string[]>) { this._toolbarFilterValues.set(v); }

  // ── Column filter local state ────────────────────────────────────────────────
  activeCol: TreeTableColumn | null = null;
  private colFilterStates = new Map<string, ColFilterState>();
  private draftOptions    = new Map<string, string[]>();

  // ── Sort state ───────────────────────────────────────────────────────────────
  activeSortField       = '';
  activeSortOrder: 1 | -1 = 1;
  activeChildSortField  = '';
  activeChildSortOrder: 1 | -1 = 1;

  // ═══════════════════════════════════════════════════════
  //  COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════════

  readonly textModeOptions = computed(() => [
    { label: this.t.translate('shared.filterModes.contains')   || 'Contains',    value: 'contains'   },
    { label: this.t.translate('shared.filterModes.startsWith') || 'Starts With', value: 'startsWith' },
    { label: this.t.translate('shared.filterModes.endsWith')   || 'Ends With',   value: 'endsWith'   },
    { label: this.t.translate('shared.filterModes.equals')     || 'Equals',      value: 'equals'     },
  ]);

  readonly totalSelectionCount = computed(() =>
    (this.selectedEntities?.length ?? 0) + (this.selectedItems?.length ?? 0)
  );

  readonly filteredModules = computed(() =>
    this.applyFiltersToModules(this._modules())
  );

  readonly filteredEntityList = computed(() =>
    this.filteredModules().flatMap(m => {
      const map = this._sortedEntitiesMap();
      return map.has(m.name) ? (map.get(m.name) ?? []) : m.entities;
    })
  );

  readonly pagedEntitiesMap = computed<Record<string, TreeNode[]>>(() => {
    const result: Record<string, TreeNode[]> = {};
    for (const mod of this.filteredModules()) {
      let entities = mod.entities;
      if (this.globalSearch?.trim() && !this.showToolbar) {
        const q = this.globalSearch.trim().toLowerCase();
        entities = entities.filter(e => this.nodeMatchesSearch(e, q));
      }
      result[mod.name] = entities;
    }
    return result;
  });

  // ═══════════════════════════════════════════════════════
  //  CELL DISPLAY CACHE
  // ═══════════════════════════════════════════════════════
  private _cellDisplayCache = new Map<string, string>();

  // ═══════════════════════════════════════════════════════
  //  CONSTRUCTOR
  // ═══════════════════════════════════════════════════════

  constructor() {
    this._searchRaw$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this._searchValue.set(v));
  }

  // ═══════════════════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════════════════

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modules']) {
      this._modules.set(this.modules ?? []);
      this._cellDisplayCache.clear();
    }
    if (changes['sortedEntitiesMap']) {
      this._sortedEntitiesMap.set(this.sortedEntitiesMap ?? new Map());
    }
    if (changes['selectedEntities'] || changes['selectedItems']) {
      this.selectionCountChange.emit(this.totalSelectionCount());
    }
  }

  ngAfterContentInit(): void {}

  // ═══════════════════════════════════════════════════════
  //  SELECTION
  // ═══════════════════════════════════════════════════════

  onEntitySelectionChange(selection: TreeNode[]): void {
    this.selectedEntities = selection;
    this.entitySelectionChange.emit(selection);
    this.selectionCountChange.emit(this.totalSelectionCount());
  }

  onItemSelectionChange(selection: TreeNode[]): void {
    this.selectedItems = selection;
    this.itemSelectionChange.emit(selection);
    this.selectionCountChange.emit(this.totalSelectionCount());
  }

  clearAllSelections(): void {
    this.onEntitySelectionChange([]);
    this.onItemSelectionChange([]);
  }

  onBulkDelete(): void {
    this.bulkDelete.emit({
      entities: this.selectedEntities ?? [],
      items:    this.selectedItems    ?? [],
    });
    this.clearAllSelections();
  }

  // ═══════════════════════════════════════════════════════
  //  SEARCH
  // ═══════════════════════════════════════════════════════

  onSearchChanged(value: string): void {
    this.searchValue = value;
    this._searchRaw$.next(value);
  }

  onClearSearch(): void {
    this._searchValue.set('');
    this._toolbarFilterValues.set({});
    this.colFilterStates.clear();
    this.draftOptions.clear();
    this.activeSortField      = '';
    this.activeSortOrder      = 1;
    this.activeChildSortField = '';
    this.activeChildSortOrder = 1;
  }

  onToolbarFilterChange(): void {
    this._toolbarFilterValues.set({ ...this.toolbarFilterValues });
  }

  // ═══════════════════════════════════════════════════════
  //  FILTER LOGIC
  // ═══════════════════════════════════════════════════════

  private applyFiltersToModules(modules: TreeModule[]): TreeModule[] {
    const search        = this._searchValue().trim().toLowerCase();
    const filterVals    = this._toolbarFilterValues();
    const activeFilters = Object.entries(filterVals).filter(([, v]) => v?.length > 0);
    const hasSearch     = !!search;
    const hasFilters    = activeFilters.length > 0;

    if (!hasSearch && !hasFilters) return modules;

    const sortedMap = this._sortedEntitiesMap();

    return modules
      .map(mod => {
        const srcEntities = sortedMap.has(mod.name)
          ? (sortedMap.get(mod.name) ?? [])
          : mod.entities;
        const entities = srcEntities.filter(e =>
          this.entityMatchesFilters(e, search, activeFilters)
        );
        return { ...mod, entities };
      })
      .filter(mod => mod.entities.length > 0);
  }

  private entityMatchesFilters(
    entity: TreeNode,
    search: string,
    activeFilters: [string, string[]][],
  ): boolean {
    if (search) {
      const fields        = Object.values(entity.data).map(v => String(v ?? '').toLowerCase());
      const entityMatches = fields.some(f => f.includes(search));
      if (!entityMatches) {
        const childMatch = (entity.children ?? []).some(c =>
          Object.values(c.data).some(v => String(v ?? '').toLowerCase().includes(search))
        );
        if (!childMatch) return false;
      }
    }
    for (const [field, values] of activeFilters) {
      if (!values.includes(String(entity.data[field] ?? ''))) return false;
    }
    return true;
  }

  private nodeMatchesSearch(node: TreeNode, q: string): boolean {
    const fields = Object.values(node.data).map(v => String(v ?? '').toLowerCase());
    if (fields.some(f => f.includes(q))) return true;
    return (node.children ?? []).some(c => this.nodeMatchesSearch(c, q));
  }

  // ═══════════════════════════════════════════════════════
  //  ROW HELPERS
  // ═══════════════════════════════════════════════════════

  hasNestedData(entity: TreeNode): boolean {
    return (entity.children?.length ?? 0) > 0;
  }

  get resolvedNestedConfig(): NestedTableConfig | undefined {
    if (this.nestedConfig) return this.nestedConfig;
    if (!this.childColumns.length) return undefined;
    const base: NestedTableConfig = {
      childKey:   'children',
      columns:    this.childColumns,
      expandable: this.grandchildColumns.length > 0,
    };
    if (this.grandchildColumns.length) {
      base.nestedConfig = {
        childKey: 'children',
        columns:  this.grandchildColumns,
        label:    this.grandchildLabel,
      };
    }
    return base;
  }

  // ═══════════════════════════════════════════════════════
  //  CELL VALUE HELPERS  (with memoization)
  // ═══════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════
  //  CELL VALUE HELPERS  (with memoization)
  // ═══════════════════════════════════════════════════════

  getCellValue(data: TreeNodeData, field: string): string {
    const val = data[field];
    return val != null ? String(val) : '';
  }

  getCellDisplay(data: TreeNodeData, col: TreeTableColumn): string {
    // If displayField is set, return that field's value directly (no mapping/translation).
    // Useful when the API already returns a localised string (e.g. data['status'] = "مفعل").
    if (col.displayField) {
      const directVal = data[col.displayField];
      return directVal != null ? String(directVal) : '';
    }

    const raw      = this.getCellValue(data, col.field);
    const cacheKey = `${col.field}::${raw}`;
    if (this._cellDisplayCache.has(cacheKey)) return this._cellDisplayCache.get(cacheKey)!;
    const mapped  = col.valueMap?.[raw] ?? raw;
    const display = col.translatePrefix
      ? this.t.translate(`${col.translatePrefix}.${mapped}`) || mapped
      : mapped;
    this._cellDisplayCache.set(cacheKey, display);
    return display;
  }

  getCellSeverity(
    data: TreeNodeData,
    col: TreeTableColumn,
  ): 'success' | 'warn' | 'secondary' | 'danger' | 'info' {
    const raw    = this.getCellValue(data, col.severityField ?? col.field);
    const mapped = col.valueMap?.[raw] ?? raw;
    return col.severityMap?.[mapped] ?? 'secondary';
  }
 

  getRoleIds(key: string): string[] {
    return this.roleAssignments.get(key) ?? [];
  }

  // ═══════════════════════════════════════════════════════
  //  ROW ACTION MENUS
  // ═══════════════════════════════════════════════════════

  openEntityMenu(event: MouseEvent, entity: TreeNode): void {
    const editLabel = this.entityActionLabel
      ? this.t.translate(this.entityActionLabel) || this.entityActionLabel
      : this.t.translate('shared.common.edit') || 'Edit';
    const deleteLabel =
      this.t.translate('shared.common.delete') || 'Delete';

    this.activeEntityMenuItems = [
      { label: `${editLabel} ${entity.data.name}`, icon: 'pi pi-pencil',
        command: () => this.entityEdit.emit(entity) },
      { label: deleteLabel, icon: 'pi pi-trash', styleClass: 'text-red-500',
        command: () => this.entityDelete.emit(entity) },
    ];
    if (this.showEntityAddChild) {
      const addLabel = this.entityAddChildLabel
        ? this.t.translate(this.entityAddChildLabel) || this.entityAddChildLabel
        : this.t.translate('shared.actions.add') || 'Add';
      this.activeEntityMenuItems.push({
        label: addLabel, icon: 'pi pi-plus',
        command: () => this.entityAddChild.emit(entity),
      });
    }
    this.entityRowMenu.toggle(event);
  }

  openItemMenu(event: MouseEvent, item: TreeNode): void {
    const editLabel = this.itemActionLabel
      ? this.t.translate(this.itemActionLabel) || this.itemActionLabel
      : this.t.translate('shared.common.edit') || 'Edit';

    const deleteLabel = this.t.translate('shared.common.delete') || 'Delete';

    this.activeItemMenuItems = [
      { label: editLabel,   icon: 'pi pi-pencil', command: () => this.itemEdit.emit(item.key) },
      { label: deleteLabel, icon: 'pi pi-trash',  styleClass: 'text-red-500',
        command: () => this.itemDelete.emit(item.key) },
    ];
    if (this.showItemAddChild) {
      const addLabel = this.itemAddChildLabel
        ? this.t.translate(this.itemAddChildLabel) || this.itemAddChildLabel
        : this.t.translate('shared.common.add') || 'Add';
      this.activeItemMenuItems.push({
        label: addLabel, icon: 'pi pi-plus',
        command: () => this.itemAddChild.emit(item.key),
      });
    }
    this.itemRowMenu.toggle(event);
  }

  openGrandchildMenu(event: MouseEvent, gc: TreeNode): void {
    const label = this.t.translate('shared.common.edit') || 'Edit';
    this.activeGrandchildMenuItems = [
      { label: `${label} ${gc.data.name}`, icon: 'pi pi-pencil',
        command: () => this.grandchildEdit.emit(gc.key) },
    ];
    this.grandchildRowMenu.toggle(event);
  }

  // ═══════════════════════════════════════════════════════
  //  COLUMN FILTER HELPERS
  // ═══════════════════════════════════════════════════════

  getColFilterState(field: string): ColFilterState {
    if (!this.colFilterStates.has(field)) {
      this.colFilterStates.set(field, {
        operator: 'and', matchMode: 'contains', value: null, selectedOptions: [],
      });
    }
    return this.colFilterStates.get(field)!;
  }

  openColPopover(event: MouseEvent, col: TreeTableColumn, popover: Popover): void {
    this.activeCol = col;
    this.draftOptions.set(col.field, [...this.getColFilterState(col.field).selectedOptions]);
    popover.toggle(event);
  }

  toggleFilterOption(field: string, value: string): void {
    const draft = this.draftOptions.get(field) ?? [];
    const idx   = draft.indexOf(value);
    if (idx === -1) draft.push(value); else draft.splice(idx, 1);
    this.draftOptions.set(field, [...draft]);
  }

  isOptionSelected(field: string, value: string): boolean {
    return (this.draftOptions.get(field) ?? []).includes(value);
  }

  hasActiveColFilter(col: TreeTableColumn): boolean {
    const state = this.colFilterStates.get(col.field);
    return !!state && (state.selectedOptions.length > 0 || !!state.value?.trim());
  }

  applyColFilter(field: string, col: TreeTableColumn): void {
    const state           = this.getColFilterState(field);
    state.selectedOptions = [...(this.draftOptions.get(field) ?? [])];
    const event: TreeTableColFilterEvent = { columnId: col.columnId ?? field };
    if (col.filterOptions?.length) {
      event.opts = [...state.selectedOptions];
    } else {
      event.text = state.value?.trim()
        ? { matchMode: state.matchMode, value: state.value } : null;
    }
    this.colFilterChanged.emit(event);
  }

  clearColFilter(field: string, col: TreeTableColumn): void {
    const state           = this.getColFilterState(field);
    state.selectedOptions = [];
    state.value           = null;
    state.matchMode       = 'contains';
    this.draftOptions.set(field, []);
    const event: TreeTableColFilterEvent = { columnId: col.columnId ?? field };
    if (col.filterOptions?.length) { event.opts = []; } else { event.text = null; }
    this.colFilterChanged.emit(event);
  }

  clearAllColFilters(): void {
    const allCols = [...this.entityColumns, ...this.childColumns, ...this.grandchildColumns];
    for (const col of allCols) {
      if (this.hasActiveColFilter(col)) this.clearColFilter(col.field, col);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  SORT HELPERS
  // ═══════════════════════════════════════════════════════

  sortCol(field: string, order: 1 | -1): void {
    if (this.entityColumns.some(c => c.field === field)) {
      this.activeSortField  = field;
      this.activeSortOrder  = order;
      this.sortChanged.emit({ field, order, level: 'entity' });
    } else {
      this.activeChildSortField  = field;
      this.activeChildSortOrder  = order;
      this.sortChanged.emit({ field, order, level: 'child' });
    }
  }
}