import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  DestroyRef,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, finalize, skip, distinctUntilChanged } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { GenericTreeTableService } from './generic-tree-table.service';
import { GenericTreeExcelService } from './generic-tree-excel.service';
import { TreeTableItem } from './tree-table-builder.service';

import {
  TreeTableComponent,
  TreeTableColumn,
  TreeModule,
  TreeNode
} from '@/app/foundation/shared/components/tree-table/tree-table';

import { ApiMetaColumn } from '../../services/base-api.service';
import { SharedToolbarComponent } from '../toolbar/shared-toolbar.component';
import { FilterComponent } from '../filter/filter.component';
import { ToolbarFilterDefinition } from '../../models/table.models';

// ── Config ────────────────────────────────────────────────────────────────────

export interface TreeTablePageConfig {
  apiUrl: string;
  fallbackJsonAr?: string;
  fallbackJsonEn?: string;
  excludedKeys?: string[];
  cellTypeMap?: Record<string, TreeTableColumn['cellType']>;
  severityMaps?: Record<
    string,
    Record<string, 'success' | 'warn' | 'secondary' | 'danger' | 'info'>
  >;
  reloadOnLangChange?: boolean;
  /** Show the grid/list layout toggle in the toolbar (default: true) */
  showLayoutToggle?: boolean;
  /** Show import + download template buttons (default: true) */
  showImport?: boolean;
}

const DEFAULT_TREE_PAGE_CONFIG: Required<TreeTablePageConfig> = {
  apiUrl: '',
  fallbackJsonAr: '',
  fallbackJsonEn: '',
  excludedKeys: [],
  cellTypeMap: {},
  severityMaps: {},
  reloadOnLangChange: true,
  showLayoutToggle: true,
  showImport: true
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-tree-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    TagModule,
    TranslocoModule,
    SkeletonModule,
    SharedToolbarComponent,
    FilterComponent,
    TreeTableComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './generic-tree-table-page.component.html',
  styleUrl: './generic-tree-table-page.component.scss'
})
export class TreeTablePageComponent implements OnInit {
  @Input({ required: true }) config!: TreeTablePageConfig;

  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  private readonly treeService = inject(GenericTreeTableService);
  private readonly excelService = inject(GenericTreeExcelService);
  private readonly messageService = inject(MessageService);
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Merged config ──────────────────────────────────────────────────────────
  private _cfgCache!: Required<TreeTablePageConfig>;
  private _cfgInput: TreeTablePageConfig | null = null;

  get cfg(): Required<TreeTablePageConfig> {
    if (this._cfgCache !== undefined && this._cfgInput === this.config)
      return this._cfgCache;
    this._cfgInput = this.config;
    this._cfgCache = { ...DEFAULT_TREE_PAGE_CONFIG, ...this.config };
    return this._cfgCache;
  }

  // ── Raw state ──────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly items = signal<TreeTableItem[]>([]);
  readonly columns = signal<TreeTableColumn[]>([]);
  readonly pageTitle = signal('');
  readonly rawMeta = signal<ApiMetaColumn[]>([]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  readonly layoutMode = signal<'list' | 'grid'>('list');

  // ── Toolbar filter values (two-way bound from app-filter chips) ────────────
  // signal عشان computed filteredItems يتفعل لما الـ filter تتغير
  private readonly _toolbarFilterValues = signal<Record<string, string[]>>({});

  get toolbarFilterValues(): Record<string, string[]> {
    return this._toolbarFilterValues();
  }
  set toolbarFilterValues(v: Record<string, string[]>) {
    this._toolbarFilterValues.set(v);
  }

  onToolbarFilterChange(): void {
    this._toolbarFilterValues.set({ ...this.toolbarFilterValues });
  }

  // ── Column derived signals ─────────────────────────────────────────────────

  readonly entityColumns = computed(() => this.columns());

  readonly childColumns = computed((): TreeTableColumn[] => {
    for (const item of this.items()) {
      if (item.children?.columns.length) return item.children.columns;
    }
    return [];
  });

  readonly grandchildColumns = computed((): TreeTableColumn[] => {
    for (const item of this.items()) {
      for (const child of item.children?.data ?? []) {
        if (child.children?.columns.length) return child.children.columns;
      }
    }
    return [];
  });

  // ── Toolbar filters from meta_data ─────────────────────────────────────────

  /**
   * بتبني ToolbarFilterDefinition[] من الـ columns الحالية.
   * كل column اتعملها filterable من الـ meta_data بتظهر كـ filter chip في الـ toolbar.
   * نفس الـ pattern اللي في rebuildToolbarFilters في GenericTablePageComponent.
   */
  readonly toolbarFilters = computed((): ToolbarFilterDefinition[] => {
    const cols = this.columns().filter((c) => c.filterable !== false);
    if (!cols.length) return [];

    return cols.map((col) => {
      // استخرج الـ distinct values من الـ items للـ column ده
      const optionSet = new Set<string>();
      const collectFromItems = (list: TreeTableItem[]) => {
        for (const item of list) {
          const val = item.data[col.field];
          if (val != null && val !== '') optionSet.add(String(val));
          if (item.children?.data.length) collectFromItems(item.children.data);
        }
      };
      collectFromItems(this.items());

      return {
        field: col.field,
        label: col.header,
        matchMode: 'in' as const,
        options: [...optionSet].sort().map((v) => ({ label: v, value: v }))
      };
    });
  });

  // ── Module filter ──────────────────────────────────────────────────────────

  readonly moduleOptions = computed(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    const collect = (list: TreeTableItem[]) => {
      for (const item of list) {
        if (item.module && !seen.has(item.module)) {
          seen.add(item.module);
          opts.push({ label: item.module, value: item.module });
        }
        if (item.children?.data.length) collect(item.children.data);
      }
    };
    collect(this.items());
    return opts;
  });

  readonly searchText = signal('');
  readonly moduleFilter = signal('');

  readonly filteredItems = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const mod = this.moduleFilter();
    const filterVals = this._toolbarFilterValues();
    const activeFilters = Object.entries(filterVals).filter(
      ([, v]) => v?.length > 0
    );

    if (!q && !mod && !activeFilters.length) return this.items();
    return this.items().filter((item) =>
      this.itemMatches(item, q, mod, activeFilters)
    );
  });

  private itemMatches(
    item: TreeTableItem,
    q: string,
    mod: string,
    activeFilters: [string, string[]][]
  ): boolean {
    // Module filter
    if (mod && item.module !== mod) return false;

    // Toolbar column filters — كل فلتر شغال على الـ entity data + children
    for (const [field, values] of activeFilters) {
      const entityVal = String(item.data[field] ?? '');
      // لو الـ entity نفسها match أو أي child match → يبقى الـ entity تظهر
      const entityMatch = values.includes(entityVal);
      const childrenMatch =
        item.children?.data.some((child) =>
          values.includes(String(child.data[field] ?? ''))
        ) ?? false;
      if (!entityMatch && !childrenMatch) return false;
    }

    // Text search
    if (!q) return true;
    const labelMatch = item.label.toLowerCase().includes(q);
    const dataMatch = Object.values(item.data).some((v) =>
      String(v ?? '')
        .toLowerCase()
        .includes(q)
    );
    return labelMatch || dataMatch;
  }

  // ── TreeModule conversion ──────────────────────────────────────────────────

  readonly treeModules = computed((): TreeModule[] => {
    const moduleMap = new Map<string, TreeNode[]>();

    for (const item of this.filteredItems()) {
      const moduleName = item.module ?? '';
      if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, []);
      moduleMap.get(moduleName)!.push(this.toTreeNode(item));
    }

    return [...moduleMap.entries()].map(([name, entities]) => ({
      name,
      entities
    }));
  });

  private toTreeNode(item: TreeTableItem): TreeNode {
    return {
      key: String(item.data['perm_code'] ?? item.data['id'] ?? item.label),
      data: { name: item.label, ...item.data } as any,
      children: item.children?.data.map((c) => this.toTreeNode(c)) ?? []
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
    if (this.cfg.reloadOnLangChange) {
      this.t.langChanges$
        .pipe(
          skip(1),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.load());
    }
  }

  private load(): void {
    this.loading.set(true);
    this.treeService
      .getAll({
        apiUrl: this.cfg.apiUrl,
        fallbackJsonAr: this.cfg.fallbackJsonAr,
        fallbackJsonEn: this.cfg.fallbackJsonEn,
        excludedKeys: this.cfg.excludedKeys,
        cellTypeMap: this.cfg.cellTypeMap,
        severityMaps: this.cfg.severityMaps
      })
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ items, columns, pageTitle, rawMeta }) => {
          this.items.set(items);
          this.columns.set(columns);
          this.pageTitle.set(pageTitle);
          this.rawMeta.set(rawMeta);
          this.searchText.set('');
          this.moduleFilter.set('');
        },
        error: () => this.items.set([])
      });
  }

  // ── Search / Filter ────────────────────────────────────────────────────────
  onSearchChanged(value: string): void {
    this.searchText.set(value);
  }
  onClearSearch(): void {
    this.searchText.set('');
    this.moduleFilter.set('');
    this._toolbarFilterValues.set({});
  }
  onModuleFilterChange(value: string): void {
    this.moduleFilter.set(value);
  }

  // ── Layout toggle ──────────────────────────────────────────────────────────
  setLayout(mode: 'list' | 'grid'): void {
    this.layoutMode.set(mode);
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  onExport(): void {
    this.excelService.exportCsv(this.filteredItems(), this.rawMeta());
  }
  onExportPdf(): void {
    this.excelService.exportPdf(
      this.filteredItems(),
      this.rawMeta(),
      this.pageTitle()
    );
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  onImport(): void {
    setTimeout(() => {
      const input = this.importInput?.nativeElement;
      if (!input) return;
      input.value = '';
      input.click();
    }, 0);
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (event.target as HTMLInputElement).value = '';

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    const isCsv = /\.csv$/i.test(file.name);
    if (!isExcel && !isCsv) {
      this.toast('error', this.t.translate('shared.import.invalidFileType'));
      return;
    }

    this.importing.set(true);
    const result = isExcel
      ? await this.excelService.importFromExcel(file, this.rawMeta())
      : await this.excelService.importFromCsv(file, this.rawMeta());
    this.importing.set(false);

    if (result.error) {
      this.toast('error', this.t.translate(`shared.import.${result.error}`));
      return;
    }

    this.toast('success', this.t.translate('toast.itemAddedSuccessfully'));
    // TODO: API call to persist imported items
  }

  onDownloadTemplate(): void {
    this.excelService.downloadTemplate(
      this.rawMeta(),
      this.columns().map((c) => c.field)
    );
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({
      severity,
      summary:
        severity === 'success'
          ? this.t.translate('toast.success')
          : this.t.translate('toast.error'),
      detail,
      life: severity === 'success' ? 3000 : 4000
    });
  }
}
