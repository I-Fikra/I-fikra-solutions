import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
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
import { HttpClient } from '@angular/common/http';
import {
  finalize,
  skip,
  distinctUntilChanged,
  switchMap
} from 'rxjs/operators';
import { catchError, forkJoin, of, Subject } from 'rxjs';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import {
  TableComponent,
  TableColumn
} from '@/app/foundation/shared/components/table/table';
import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';
import { ToolbarFilterDefinition } from '@/app/foundation/shared/models/table.models';
import { RawMetaColumn } from '@/app/foundation/shared/services/table-builder.service';
import { ReadableDateTimePipe } from '@/app/foundation/shared/pipes/readableDateTime.pipe';
import { SeverityPipe } from '@/app/foundation/shared/pipes/severity.pipe';
import { uniqueOptions } from '@/app/foundation/shared/utils/table.utils';

import { GenericTableService } from './generic-table.service';
import { GenericExcelService } from './generic-excel.service';
import {
  DataTablePageConfig,
  DEFAULT_CONFIG,
  DataTableActions
} from './generic-table-page.config';
import { RouterLink } from '@angular/router';

// ── FormField — built from meta_data ──────────────────────────────────────────
export interface FormField {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options: { label: string; value: any }[];
  lookup: string | null;
  isStatus?: boolean;
}

@Component({
  selector: 'app-data-table-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ConfirmDialog,
    SelectModule,
    InputTextModule,
    TextareaModule,
    RadioButtonModule,
    ButtonModule,
    TagModule,
    TranslocoModule,
    TableComponent,
    DialogShellComponent,
    ReadableDateTimePipe,
    SeverityPipe,
    RouterLink
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './generic-table-page.config.html',
  styleUrl: './generic-table-page.component.scss'
})
export class DataTablePageComponent implements OnInit {
  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input({ required: true }) config!: DataTablePageConfig;
  @Input() set newItemToAdd(item: any) {
    // ← new
    if (!item) return;
    this.items.update((list) => [item, ...list]);
    this.rowActionsCache.clear();
    this.rebuildToolbarFilters(this.columns());
  }

  /**
   * Emits the clicked item when the user triggers "New" or "View Details".
   * If a parent listens to this output, the built-in view dialog is suppressed
   * and the parent handles the display (e.g. a custom dialog or navigation).
   * If no parent listens, openNew() or openView() falls back to the internal dialog.
   */
  @Output() viewItem = new EventEmitter<any>();
  @Output() createItem = new EventEmitter<void>();
  @Output() formReady = new EventEmitter<{
    fields: FormField[];
    nameFieldKey: string;
  }>();

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly genericService = inject(GenericTableService);
  private readonly excelService = inject(GenericExcelService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly t = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly load$ = new Subject<void>();

  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  // ── Merged config — memoized ──────────────────────────────────────────────
  // ✅ PERF: cached, بيتحسب بس لما config يتغير مش كل access
  private _cfgCache!: DataTablePageConfig & { actions: DataTableActions };
  private _cfgInput: DataTablePageConfig | null = null;

  get cfg(): DataTablePageConfig & { actions: DataTableActions } {
    if (this._cfgCache !== undefined && this._cfgInput === this.config)
      return this._cfgCache;
    this._cfgInput = this.config;
    this._cfgCache = {
      ...DEFAULT_CONFIG,
      ...this.config,
      actions: { ...DEFAULT_CONFIG.actions, ...this.config.actions }
    } as any;
    return this._cfgCache;
  }

  // ── Core state ────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly items = signal<any[]>([]);
  readonly pageTitle = signal('');
  readonly columns = signal<TableColumn[]>([]);
  readonly formFields = signal<FormField[]>([]);
  readonly toolbarFilters = signal<ToolbarFilterDefinition[]>([]);
  readonly rawMeta = signal<RawMetaColumn[]>([]);

  readonly statusOptions = computed(() => {
    const statusCol = this.columns().find((c) => c.type === 'status');
    if (!statusCol) return [];
    return uniqueOptions(this.items(), statusCol.field);
  });

  readonly toolbarFiltersComputed = computed(() => this.toolbarFilters());

  // ── Dialog state ──────────────────────────────────────────────────────────
  readonly createDialogVisible = signal(false);
  readonly editDialogVisible = signal(false);
  readonly viewDialogVisible = signal(false);

  readonly newItem = signal<Record<string, any>>({});
  readonly selectedItem = signal<Record<string, any>>({});
  nameFieldKey = '';

  // ── Form validity ─────────────────────────────────────────────────────────
  readonly isCreateFormValid = computed(() =>
    this.formFields()
      .filter((f) => f.required)
      .every((f) => !!this.newItem()[f.field])
  );

  readonly isEditFormValid = computed(() =>
    this.formFields()
      .filter((f) => f.required)
      .every((f) => !!this.selectedItem()[f.field])
  );

  // ── Row actions cache ─────────────────────────────────────────────────────
  private rowActionsCache = new Map<any, MenuItem[]>();

  getRowActions = (item: any): MenuItem[] => {
    const id = item[this.cfg.idField];
    if (!this.rowActionsCache.has(id)) {
      const actions: MenuItem[] = [];
      const cfg = this.cfg;

      if (cfg.actions.view) {
        actions.push({
          label: this.t.translate('actions.view'),
          icon: 'pi pi-eye',
          command: () => this.openView(item)
        });
      }

      // Extra row actions (viewMessages, viewVisits, etc.)
      if (cfg.extraRowActions?.length) {
        cfg.extraRowActions.forEach((extra) => {
          if (extra.separator) {
            actions.push({ separator: true });
          } else {
            actions.push({
              label: this.t.translate(extra.labelKey!),
              icon: extra.icon,
              routerLink: extra.routerLink,
              command: extra.command ? () => extra.command!(item) : undefined
            });
          }
        });
      }

      if (cfg.actions.edit) {
        actions.push({
          label: this.t.translate('actions.edit'),
          icon: 'pi pi-pencil',
          command: () => this.openEdit(item)
        });
      }

      if (cfg.actions.delete) {
        actions.push({ separator: true });
        actions.push({
          label: this.t.translate('actions.delete'),
          icon: 'pi pi-trash',
          styleClass: 'text-red-500',
          command: () => this.confirmDelete(item)
        });
      }

      this.rowActionsCache.set(id, actions);
    }
    return this.rowActionsCache.get(id)!;
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          return this.genericService
            .getAll(this.config)
            .pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ items, columns, pageTitle, rawMeta }) => {
          const enrichedCols = this.applySubFieldMap(columns);
          this.items.set(this.injectTimeSuffixFields(items, enrichedCols));
          this.columns.set(enrichedCols);
          this.pageTitle.set(pageTitle);
          this.rawMeta.set(rawMeta);
          this.rowActionsCache.clear();
          this.buildFormFields(rawMeta as any[]);
          this.rebuildToolbarFilters(columns);
          this.loading.set(false);
        },
        error: () => {
          this.items.set([]);
          this.loading.set(false);
        }
      });

    // أول load
    this.load$.next();

    // إعادة load عند تغيير اللغة
    if (this.cfg.reloadOnLangChange) {
      this.t.langChanges$
        .pipe(
          skip(1),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.load$.next());
    }
  }

  private load(): void {
    this.load$.next();
  }
  // ── Build form fields from meta_data ──────────────────────────────────────
  private buildFormFields(metaData: any[]): void {
    if (!metaData?.length) return;

    const excluded = new Set(this.cfg.excludedKeys ?? []);
    const visible = metaData
      .filter((m) => m.is_public > 0 && !excluded.has(m.secondary_code))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const fields: FormField[] = visible.map((m) => ({
      field: m.secondary_code,
      label: m.name,
      type: this.resolveInputType(m),
      required: true,
      options: m.enum ? this.resolveEnumOptions(m.enum) : [],
      lookup: m.lookup ?? null,
      isStatus: ['status', 'الحالة', 'حالة'].some((h) =>
        m.secondary_code.toLowerCase().includes(h)
      )
    }));

    this.nameFieldKey =
      visible.find((m) =>
        ['name', 'اسم'].some((h) => m.secondary_code.toLowerCase().includes(h))
      )?.secondary_code ?? '';

    // Fetch lookup endpoints in parallel
    const lookupFields = fields.filter((f) => f.lookup);
    const lookupRequests = lookupFields.map((f) =>
      this.http.get<any>(f.lookup!).pipe(catchError(() => of([])))
    );

    if (!lookupRequests.length) {
      this.formFields.set(fields);
      this.initNewItem(fields);
      this.formReady.emit({ fields, nameFieldKey: this.nameFieldKey });
      return;
    }

    forkJoin(lookupRequests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((responses) => {
        lookupFields.forEach((f, i) => {
          const res = responses[i];
          f.options = Array.isArray(res)
            ? res.map((item: any) => ({
                label: item.label ?? item.name ?? String(item),
                value: item.value ?? item.id ?? item
              }))
            : [];
        });
        this.formFields.set(fields);
        this.initNewItem(fields);
        this.formReady.emit({ fields, nameFieldKey: this.nameFieldKey });
      });
  }

  private resolveInputType(m: any): FormField['type'] {
    if (m.enum || m.lookup) return 'select';
    switch (m.type) {
      case 'NUMBER':
        return 'number';
      case 'DATE':
        return 'date';
      default:
        return 'text';
    }
  }

  private resolveEnumOptions(enumVal: any[]): { label: string; value: any }[] {
    if (!Array.isArray(enumVal)) return [];
    return enumVal.map((e) =>
      typeof e === 'object'
        ? { label: e.label ?? String(e.value), value: e.value }
        : { label: String(e), value: e }
    );
  }

  private initNewItem(fields: FormField[]): void {
    const blank = fields.reduce(
      (acc, f) => {
        acc[f.field] = '';
        return acc;
      },
      {} as Record<string, any>
    );
    this.newItem.set(blank);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  openNew(): void {
    if (this.createItem.observed) {
      // Parent has its own dialog → delegate, suppress internal dialog
      this.createItem.emit();
    } else {
      // No parent → use built-in dialog
      this.initNewItem(this.formFields());
      this.createDialogVisible.set(true);
    }
  }

  openView(item: any): void {
    if (this.viewItem.observed) {
      // Parent is listening → delegate completely, suppress internal dialog
      this.viewItem.emit(item);
    } else {
      // No parent listener → use built-in view dialog
      this.selectedItem.set({ ...item });
      this.viewDialogVisible.set(true);
    }
  }

  openEdit(item: any): void {
    this.selectedItem.set({ ...item });
    this.editDialogVisible.set(true);
  }

  saveCreate(): void {
    if (!this.isCreateFormValid()) return;
    const newRecord = { ...this.newItem(), [this.cfg.idField]: Date.now() };
    this.items.update((list) => [newRecord, ...list]);
    this.rowActionsCache.clear();
    this.rebuildToolbarFilters(this.columns());
    this.createDialogVisible.set(false);
    this.toast(
      'success',
      this.t.translate('toast.itemAddedSuccessfully', {
        name: this.newItem()[this.nameFieldKey]
      })
    );
    // TODO: API call
  }

  saveEdit(): void {
    if (!this.isEditFormValid()) return;
    const updated = this.selectedItem();
    this.items.update((list) =>
      list.map((i) =>
        i[this.cfg.idField] === updated[this.cfg.idField] ? { ...updated } : i
      )
    );
    this.rowActionsCache.clear();
    this.rebuildToolbarFilters(this.columns());
    this.editDialogVisible.set(false);
    this.toast(
      'success',
      this.t.translate('toast.itemUpdatedSuccessfully', {
        name: this.selectedItem()[this.nameFieldKey]
      })
    );
    // TODO: API call
  }

  confirmDelete(item: any): void {
    this.confirmationService.confirm({
      header: this.t.translate('dialog.deleteTitle'),
      message:
        this.t.translate('dialog.deleteText', {
          name: item[this.nameFieldKey]
        }) || `Are you sure you want to delete "${item[this.nameFieldKey]}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.t.translate('actions.delete'),
      rejectLabel: this.t.translate('actions.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.items.update((list) =>
          list.filter((i) => i[this.cfg.idField] !== item[this.cfg.idField])
        );
        this.rowActionsCache.clear();
        this.rebuildToolbarFilters(this.columns());
        this.toast(
          'success',
          this.t.translate('toast.itemDeletedSuccessfully', {
            name: item[this.nameFieldKey]
          })
        );
        // TODO: API call
      }
    });
  }

  // ── Export / Import ───────────────────────────────────────────────────────
  onExport(): void {
    this.excelService.exportCsv(this.items(), this.rawMeta());
  }
  onExportPdf(): void {
    this.excelService.exportPdf(this.items(), this.rawMeta(), this.pageTitle());
  }
  onDownloadTemplate(): void {
    this.excelService.downloadTemplate(
      this.rawMeta(),
      this.columns().map((c) => c.field)
    );
  }

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
      this.toast('error', 'Only .csv, .xlsx, .xls files are accepted.');
      return;
    }

    this.importing.set(true);
    const result = isExcel
      ? await this.excelService.importFromExcel(file, this.rawMeta())
      : await this.excelService.importFromCsv(file, this.rawMeta());
    this.importing.set(false);

    if (result.error) {
      this.toast('error', result.error);
      return;
    }

    const imported = result.items.map((item, i) => ({
      ...item,
      [this.cfg.idField]: `imported-${Date.now()}-${i}`
    }));

    this.items.update((list) => [...imported, ...list]);
    this.rowActionsCache.clear();
    this.rebuildToolbarFilters(this.columns());
    this.toast('success', `${imported.length} items imported.`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  toDateInputValue(iso: string | null): string {
    if (!iso) return '';
    return iso.split('T')[0];
  }

  updateNewItem(field: string, value: any): void {
    this.newItem.update((f) => ({ ...f, [field]: value }));
  }

  updateSelectedItem(field: string, value: any): void {
    this.selectedItem.update((f) => ({ ...f, [field]: value }));
  }

  /** Apply subFieldMap from config + auto-add time subField for date columns */
  private applySubFieldMap(columns: TableColumn[]): TableColumn[] {
    const map = this.cfg.subFieldMap ?? {};
    return columns.map((col) => {
      // Explicit subField override takes priority
      if (map[col.field]) return { ...col, subField: map[col.field] };
      // Auto: date columns get a virtual _time subField for hover display
      if (col.type === 'date') return { ...col, subField: col.field + '_time' };
      return col;
    });
  }

  /**
   * For every date column, inject a virtual `field_time` property on each item
   * containing only the time portion (e.g. "01:54:45 PM").
   * These are consumed by the TableComponent as subField hover text.
   */
  private injectTimeSuffixFields(items: any[], columns: TableColumn[]): any[] {
    const dateCols = columns.filter((c) => c.type === 'date' && c.field);
    if (!dateCols.length) return items;
    return items.map((item) => {
      const extra: Record<string, string> = {};
      dateCols.forEach((col) => {
        const raw = item[col.field];
        if (raw) {
          const d = raw instanceof Date ? raw : new Date(raw);
          if (!isNaN(d.getTime())) {
            extra[col.field + '_time'] = d.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          }
        }
      });
      return Object.keys(extra).length ? { ...item, ...extra } : item;
    });
  }

  // ✅ PERF: debounce + smart diff — لا يعمل set لو الـ options لم تتغير فعلياً
  // هذا يمنع reset الـ filter values في app-table عند كل CRUD operation
  private _rebuildScheduled = false;
  private _rebuildCols: TableColumn[] | null = null;

  private rebuildToolbarFilters(columns: TableColumn[]): void {
    this._rebuildCols = columns;
    if (this._rebuildScheduled) return;
    this._rebuildScheduled = true;
    queueMicrotask(() => {
      this._rebuildScheduled = false;
      const cols = this._rebuildCols ?? columns;
      const filterableTypes: TableColumn['type'][] = ['text', 'status'];
      const next = cols
        .filter((col) => filterableTypes.includes(col.type ?? 'text'))
        .map((col) => ({
          field: col.field,
          label: col.header,
          matchMode: 'in' as const,
          options: uniqueOptions(this.items(), col.field)
        }));

      // ✅ FIX: لا تعمل set جديدة لو الـ options لم تتغير — يمنع reset الـ filter state
      const current = this.toolbarFilters();
      const changed =
        next.length !== current.length ||
        next.some((n, i) => {
          const c = current[i];
          if (!c || n.field !== c.field) return true;
          if (n.options.length !== c.options.length) return true;
          return n.options.some((o, j) => o.value !== c.options[j]?.value);
        });

      if (changed) this.toolbarFilters.set(next);
    });
  }

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
  // ══════════════════════════════════════════════════════════════════════════════
  // Add these inside DataTablePageComponent (generic-table-page.component.ts)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 1. Add RouterLink to imports array ───────────────────────────────────────
  //   import { RouterLink } from '@angular/router';
  //   ...
  //   imports: [ ..., RouterLink ]

  // ── 2. Add this signal alongside the other dialog-state signals ───────────────

  /** Tracks which long-text fields are expanded in the view dialog */
  readonly expandedFields = signal<Record<string, boolean>>({});

  // ── 3. Reset expandedFields when the view dialog opens ───────────────────────
  //   In openView(), before viewDialogVisible.set(true) add:

  // this.expandedFields.set({});

  // ── 4. Add these helper methods inside the class ─────────────────────────────

  /** Returns true if the value is a string longer than ~120 chars (worth clamping) */
  isLongText(value: any): boolean {
    return typeof value === 'string' && value.length > 120;
  }

  /** Toggle expand/collapse for a specific field in the view dialog */
  toggleFieldExpand(field: string): void {
    this.expandedFields.update((s) => ({ ...s, [field]: !s[field] }));
  }

  /**
   * Resolves cfg.seeMoreLink to a routerLink array for the current item.
   * Supports: string | any[] | (item) => string | any[]
   */
  resolveSeeMoreLink(item: any): any[] {
    const link = this.cfg.seeMoreLink;
    if (!link) return [];
    const resolved = typeof link === 'function' ? link(item) : link;
    return Array.isArray(resolved) ? resolved : [resolved];
  }
}
