/**
 * permissions.ts — Permissions page component (v5 — Performance)
 *
 * التغييرات عن v4:
 * ✅ [9] getData$() في الـ service بقى one-shot (بدون langChanges$/startWith).
 *         الـ component دلوقتي مسئول عن الـ reload عند تغيير اللغة
 *         عبر langChanges$.pipe(skip(1)) — نفس pattern الـ roles/users.
 *         ده بيحل الـ 4× /api/permissions-ar.json في الـ network waterfall.
 * ✅ [10] حُذف destroy$ Subject الزائد (كان موجود من v3 وما اتشالش في v4)
 * ✅ [11] حُذف ngOnDestroy الزائد (takeUntilDestroyed يكفي)
 * ✅ [12] أُضيف TranslocoService inject للـ langChanges$ subscription
 */

// 1. Angular core
import {
  Component,
  computed,
  signal,
  WritableSignal,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip, take } from 'rxjs/operators';

// 3. PrimeNG
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// 4. Third-party
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// 5. Shared components
import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';
import { BottomBarAction } from '@/app/foundation/shared/models/table.models';
import {
  TreeTableComponent,
  TreeModule as Module,
  TreeNode as PermissionNode,
  TreeTableColumn as PermTableColumn,
  TreeTableSortEvent,
  TreeTableColFilterEvent,
  Role
} from '@/app/foundation/shared/components/tree-table/tree-table';
import {
  ActiveColFilters,
  ActiveSort,
  EMPTY_COL_FILTERS,
  FilterOption,
  RoleState,
  STATUS_SEVERITY_MAP
} from './permission.model';
import {
  PermissionsDataService,
  PermissionsTranslations
} from './permissions-data.service';
import {
  buildActionOptionsFromData,
  buildCategoryOptionsFromData,
  buildEntityColumns,
  buildFieldColumns,
  buildPermissionColumns,
  buildStatusOptions
} from './permissions.columns';
import {
  SharedToolbarComponent,
  FilterComponent
} from '@/app/foundation/shared';
import { SharedBottomBarComponent } from '@/app/foundation/shared/components/bottom-bar/shared-bottombar.component';
import { Card } from '@/app/foundation/shared/components/card/card';

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-permissions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    TooltipModule,
    DialogShellComponent,
    TranslocoModule,
    TreeTableComponent,
    SharedToolbarComponent,
    FilterComponent,
    SharedBottomBarComponent,
    Card
  ],
  templateUrl: './permissions.html',
  styleUrl: './permissions.scss',
  providers: [MessageService]
})
export class PermissionsComponent implements OnInit {
  // ── 1. Public signals / state ───────────────────────────────────────────────

  availableRoles = signal<Role[]>([]);
  rawModules: WritableSignal<Module[]> = signal<Module[]>([]);

  selectedPermissions = signal<PermissionNode[]>([]);
  selectedEntities = signal<PermissionNode[]>([]);

  entityColumns = signal<PermTableColumn[]>([]);
  permColumns = signal<PermTableColumn[]>([]);
  fieldColumns = signal<PermTableColumn[]>([]);

  /** Must be replaced by reference (not mutated) for OnPush. */
  expandedRows: { [key: string]: boolean } = {};

  bulkDialogVisible = signal(false);
  entityDialogVisible = signal(false);
  permissionDialogVisible = signal(false);

  currentEntityNode = signal<PermissionNode | null>(null);
  currentPermissionNode = signal<PermissionNode | null>(null);
  permissionDialogRoles = signal<string[]>([]);
  dialogRoleStateCache = signal<Map<string, RoleState>>(new Map());

  roleAssignments = signal<Map<string, string[]>>(new Map());

  activeSort = signal<ActiveSort>({ field: '', order: 1, level: 'entity' });
  activeColFilters = signal<ActiveColFilters>({ ...EMPTY_COL_FILTERS });

  /** Controls table vs cards layout — driven from the host toolbar toggle. */
  layoutMode = signal<'list' | 'grid'>('list');

  /** Translations served from the API — replaces Transloco i18n files. */
  translations = signal<PermissionsTranslations | null>(null);

  /**
   * Non-null accessor for the template — avoids `string | undefined` errors.
   * Returns an empty-string proxy before translations load.
   */
  get ui(): PermissionsTranslations {
    return this.translations() ?? ({} as PermissionsTranslations);
  }

  // ── Card-specific state ─────────────────────────────────────────────────────

  cardExpandedPerms: Record<string, boolean> = {};

  // ── 2. Bottom bar action definitions ───────────────────────────────────────

  readonly bulkActions: BottomBarAction[] = [
    {
      key: 'bulk-edit',
      label: 'Edit Roles',
      icon: 'pi pi-pencil',
      severity: 'secondary',
      tooltip: 'Edit role assignments for selected permissions'
    },
    {
      key: 'export',
      label: 'Export',
      icon: 'pi pi-download',
      severity: 'secondary'
    }
  ];

  // ── 3. Filter option lists ─────────────────────────────────────────────────

  readonly moduleFilterOptions = computed<FilterOption[]>(() =>
    this.rawModules().map((m) => ({ label: m.name, value: m.name }))
  );

  readonly statusFilterOptions = computed<FilterOption[]>(() => {
    const values = new Set<string>();
    this.rawModules().forEach((m) =>
      m.entities.forEach((e) => {
        if (e.data['status']) values.add(e.data['status'] as string);
      })
    );
    return Array.from(values)
      .sort()
      .map((v) => ({
        label: this.translations()?.statusLabels?.[v] ?? v,
        value: v
      }));
  });

  readonly permissionStatusFilterOptions = computed<FilterOption[]>(() => {
    const values = new Set<string>();
    this.rawModules().forEach((m) =>
      m.entities.forEach((e) =>
        (e.children ?? []).forEach((c) => {
          if (c.data['status']) values.add(c.data['status'] as string);
        })
      )
    );
    return Array.from(values)
      .sort()
      .map((v) => ({
        label: this.translations()?.statusLabels?.[v] ?? v,
        value: v
      }));
  });

  readonly permissionFilterOptions = computed<FilterOption[]>(() => {
    const names = new Set<string>();
    const collect = (nodes: PermissionNode[]) => {
      for (const n of nodes) {
        if (!n.children?.length) names.add(n.data.name);
        else collect(n.children);
      }
    };
    this.rawModules().forEach((m) => collect(m.entities));
    return Array.from(names)
      .sort()
      .map((name) => ({ label: name, value: name }));
  });

  // ── 4. Filter pipeline ─────────────────────────────────────────────────────

  readonly filteredModules = computed<Module[]>(() => {
    const globalQuery = this.globalSearchText().trim().toLowerCase();
    const modFilters = this.selectedModuleFilters();
    const entityStatusFilters = this.selectedStatusFilters();
    const permStatusFilters = this.selectedPermissionStatusFilters();
    const permFilters = this.selectedPermissionFilters();
    const colF = this.activeColFilters();

    let modules = this.rawModules();

    if (modFilters.length)
      modules = modules.filter((m) => modFilters.includes(m.name));

    return modules.reduce<Module[]>((acc, mod) => {
      const filteredEntities = mod.entities.reduce<PermissionNode[]>(
        (res, entity) => {
          if (
            entityStatusFilters.length &&
            !entityStatusFilters.includes(
              (entity.data['status'] as string) ?? ''
            )
          )
            return res;

          let filteredChildren = entity.children ? [...entity.children] : [];

          if (permFilters.length)
            filteredChildren = filteredChildren.filter((c) =>
              permFilters.includes(c.data.name)
            );

          if (permStatusFilters.length)
            filteredChildren = filteredChildren.filter((c) =>
              permStatusFilters.includes((c.data['status'] as string) ?? '')
            );

          if (colF.entityName?.value) {
            const { matchMode, value } = colF.entityName;
            const q = value!.toLowerCase();
            const n = entity.data.name.toLowerCase();
            const pass =
              matchMode === 'startsWith'
                ? n.startsWith(q)
                : matchMode === 'endsWith'
                  ? n.endsWith(q)
                  : matchMode === 'equals'
                    ? n === q
                    : n.includes(q);
            if (!pass) return res;
          }

          if (
            colF.entityCat.length &&
            !colF.entityCat.includes((entity.data['category'] as string) ?? '')
          )
            return res;

          if (
            colF.entityStatus.length &&
            !colF.entityStatus.includes((entity.data['status'] as string) ?? '')
          )
            return res;

          if (colF.childName?.value) {
            const { matchMode, value } = colF.childName;
            const q = value!.toLowerCase();
            filteredChildren = filteredChildren.filter((c) => {
              const n = c.data.name.toLowerCase();
              return matchMode === 'startsWith'
                ? n.startsWith(q)
                : matchMode === 'endsWith'
                  ? n.endsWith(q)
                  : matchMode === 'equals'
                    ? n === q
                    : n.includes(q);
            });
          }

          if (colF.childStatus.length)
            filteredChildren = filteredChildren.filter((c) =>
              colF.childStatus.includes((c.data['status'] as string) ?? '')
            );

          if (colF.childAction.length)
            filteredChildren = filteredChildren.filter((c) =>
              colF.childAction.includes((c.data['action'] as string) ?? '')
            );

          if (globalQuery) {
            const matchEntity =
              entity.data.name.toLowerCase().includes(globalQuery) ||
              ((entity.data['category'] as string) ?? '')
                .toLowerCase()
                .includes(globalQuery);
            filteredChildren = filteredChildren.filter(
              (c) =>
                c.data.name.toLowerCase().includes(globalQuery) ||
                ((c.data['action'] as string) ?? '')
                  .toLowerCase()
                  .includes(globalQuery)
            );
            if (!matchEntity && !filteredChildren.length) return res;
          }

          const hasChildFilter =
            permStatusFilters.length ||
            permFilters.length ||
            colF.childStatus.length ||
            colF.childAction.length ||
            !!colF.childName?.value ||
            !!globalQuery;

          if (hasChildFilter && !filteredChildren.length) return res;

          res.push({ ...entity, children: filteredChildren });
          return res;
        },
        []
      );

      if (filteredEntities.length)
        acc.push({ ...mod, entities: filteredEntities });
      return acc;
    }, []);
  });

  readonly sortedEntitiesMap = computed<Map<string, PermissionNode[]>>(() => {
    const map = new Map<string, PermissionNode[]>();
    const sort = this.activeSort();

    for (const mod of this.filteredModules()) {
      let entities = [...mod.entities];

      if (sort.level === 'entity' && sort.field) {
        entities = entities.sort((a, b) => {
          const av = String(a.data[sort.field] ?? '').toLowerCase();
          const bv = String(b.data[sort.field] ?? '').toLowerCase();
          return sort.order * av.localeCompare(bv);
        });
      }

      if (sort.level === 'child' && sort.field) {
        entities = entities.map((e) => ({
          ...e,
          children: e.children
            ? [...e.children].sort((a, b) => {
                const av = String(a.data[sort.field] ?? '').toLowerCase();
                const bv = String(b.data[sort.field] ?? '').toLowerCase();
                return sort.order * av.localeCompare(bv);
              })
            : e.children
        }));
      }

      map.set(mod.name, entities);
    }
    return map;
  });

  // ── 5. Private state ────────────────────────────────────────────────────────

  private readonly _globalSearchText = signal('');
  private readonly _selectedModuleFilters = signal<string[]>([]);
  private readonly _selectedStatusFilters = signal<string[]>([]);
  private readonly _selectedPermissionStatusFilters = signal<string[]>([]);
  private readonly _selectedPermissionFilters = signal<string[]>([]);

  readonly globalSearchText = this._globalSearchText.asReadonly();
  readonly selectedModuleFilters = this._selectedModuleFilters.asReadonly();
  readonly selectedStatusFilters = this._selectedStatusFilters.asReadonly();
  readonly selectedPermissionStatusFilters =
    this._selectedPermissionStatusFilters.asReadonly();
  readonly selectedPermissionFilters =
    this._selectedPermissionFilters.asReadonly();

  // ✅ destroy$ Subject حُذف — takeUntilDestroyed يكفي تماماً
  private readonly roleAssignmentsMap = new Map<string, string[]>();

  // ── 6. Injections ───────────────────────────────────────────────────────────

  private readonly dataSvc = inject(PermissionsDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly t = inject(TranslocoService); // ✅ for skip(1) reload
  private readonly messageService = inject(MessageService, { self: true });

  // ── 7. Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // ✅ FIX: Load once on init, then skip(1) on langChanges$ to avoid the
    // duplicate calls caused by the old getData$() + startWith(null) pattern.
    this.loadData();

    this.t.langChanges$
      .pipe(
        skip(1), // skip the immediate replay emit
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadData());

    this.dataSvc
      .getRoleAssignments$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((assignments) => {
        this.roleAssignmentsMap.clear();
        for (const [key, roleIds] of assignments) {
          this.roleAssignmentsMap.set(key, roleIds);
        }
        const mods = this.shallowCloneModuleTree(this.rawModules());
        this.roleAssignmentsMap.forEach((roleIds, key) => {
          this.updateNodeCountInTree(mods, key, roleIds.length);
        });
        this.rawModules.set(mods);
        this.roleAssignments.set(new Map(this.roleAssignmentsMap));
      });
  }

  // ✅ ngOnDestroy حُذف — takeUntilDestroyed بيعمل cleanup تلقائي

  // ── 8. Public event handlers ────────────────────────────────────────────────

  onSearchChanged(value: string): void {
    this._globalSearchText.set(value);
  }

  clearFilters(): void {
    this._globalSearchText.set('');
    this._selectedModuleFilters.set([]);
    this._selectedStatusFilters.set([]);
    this._selectedPermissionStatusFilters.set([]);
    this._selectedPermissionFilters.set([]);
    this.activeColFilters.set({ ...EMPTY_COL_FILTERS });
  }

  updateModuleFilters(v: string[]): void {
    this._selectedModuleFilters.set([...v]);
  }
  updateStatusFilters(v: string[]): void {
    this._selectedStatusFilters.set([...v]);
  }
  updatePermissionStatusFilters(v: string[]): void {
    this._selectedPermissionStatusFilters.set([...v]);
  }
  updatePermissionFilters(v: string[]): void {
    this._selectedPermissionFilters.set([...v]);
  }

  onColFilterChanged(event: TreeTableColFilterEvent): void {
    const f = { ...this.activeColFilters() };
    switch (event.columnId) {
      case 'entity-name':
        f.entityName = event.text ?? null;
        break;
      case 'entity-cat':
        f.entityCat = event.opts ?? [];
        break;
      case 'entity-status':
        f.entityStatus = event.opts ?? [];
        break;
      case 'child-name':
        f.childName = event.text ?? null;
        break;
      case 'child-status':
        f.childStatus = event.opts ?? [];
        break;
      case 'child-action':
        f.childAction = event.opts ?? [];
        break;
    }
    this.activeColFilters.set(f);
  }

  onSortChanged(event: TreeTableSortEvent): void {
    this.activeSort.set({
      field: event.field,
      order: event.order as 1 | -1,
      level: event.level as 'entity' | 'child'
    });
  }

  onLayoutToggle(mode: 'list' | 'grid'): void {
    this.layoutMode.set(mode);
  }

  clearSelection(): void {
    this.selectedPermissions.set([]);
    this.selectedEntities.set([]);
  }

  exportToCSV(): void {
    this.exportSelectedPermissions();
  }

  onEntitySelectionChange(nodes: PermissionNode[]): void {
    this.selectedEntities.set(nodes);
  }

  onPermissionSelectionChange(nodes: PermissionNode[]): void {
    this.selectedPermissions.set(nodes);
  }

  onBottomBarAction(key: string): void {
    if (key === 'bulk-edit') {
      this.rebuildDialogCacheForBulk();
      this.bulkDialogVisible.set(true);
    } else if (key === 'export') {
      this.exportSelectedPermissions();
    }
  }

  openEntityDialog(node: PermissionNode): void {
    this.currentEntityNode.set(node);
    this.rebuildDialogCacheForEntity(node);
    this.entityDialogVisible.set(true);
  }

  openPermissionDialog(nodeOrKey: PermissionNode | string): void {
    const node =
      typeof nodeOrKey === 'string' ? this.findNodeByKey(nodeOrKey) : nodeOrKey;
    if (!node) return;
    this.currentPermissionNode.set(node);
    const existing = this.roleAssignmentsMap.get(node.key) ?? [];
    this.permissionDialogRoles.set([...existing]);
    const map = new Map<string, RoleState>();
    for (const role of this.availableRoles()) {
      map.set(role.id, {
        checked: existing.includes(role.id),
        indeterminate: false
      });
    }
    this.dialogRoleStateCache.set(map);
    this.permissionDialogVisible.set(true);
  }

  toggleDialogRole(roleId: string, checked: boolean): void {
    const current = this.dialogRoleStateCache();
    const next = new Map(current);
    next.set(roleId, { checked, indeterminate: false });
    this.dialogRoleStateCache.set(next);
  }

  savePermissionDialog(): void {
    const node = this.currentPermissionNode();
    if (!node) return;

    const assigned = Array.from(this.dialogRoleStateCache().entries())
      .filter(([, s]) => s.checked)
      .map(([id]) => id);

    this.roleAssignmentsMap.set(node.key, assigned);
    const mods = this.shallowCloneModuleTree();
    this.updateNodeCountInTree(mods, node.key, assigned.length);
    this.rawModules.set(mods);
    this.roleAssignments.set(new Map(this.roleAssignmentsMap));
    this.permissionDialogVisible.set(false);

    this.messageService.add({
      severity: 'success',
      summary: this.tr('saved'),
      detail: this.tr('changesSaved')
    });
  }

  saveEntityDialog(): void {
    const node = this.currentEntityNode();
    if (!node) return;

    const children = node.children ?? [];
    const mods = this.shallowCloneModuleTree();

    for (const child of children) {
      const current = this.roleAssignmentsMap.get(child.key) ?? [];
      const roleStates = this.dialogRoleStateCache();
      const next = [...current];

      for (const [roleId, state] of roleStates.entries()) {
        if (state.checked && !next.includes(roleId)) {
          next.push(roleId);
        } else if (!state.checked && !state.indeterminate) {
          const idx = next.indexOf(roleId);
          if (idx !== -1) next.splice(idx, 1);
        }
      }

      this.roleAssignmentsMap.set(child.key, next);
      this.updateNodeCountInTree(mods, child.key, next.length);
    }

    this.rawModules.set(mods);
    this.roleAssignments.set(new Map(this.roleAssignmentsMap));
    this.entityDialogVisible.set(false);

    this.messageService.add({
      severity: 'success',
      summary: this.tr('saved'),
      detail: this.tr('changesSaved')
    });
  }

  saveBulkDialog(): void {
    const nodes = this.selectedPermissions();
    const mods = this.shallowCloneModuleTree();

    for (const node of nodes) {
      const current = this.roleAssignmentsMap.get(node.key) ?? [];
      const roleStates = this.dialogRoleStateCache();
      const next = [...current];

      for (const [roleId, state] of roleStates.entries()) {
        if (state.checked && !next.includes(roleId)) {
          next.push(roleId);
        } else if (!state.checked && !state.indeterminate) {
          const idx = next.indexOf(roleId);
          if (idx !== -1) next.splice(idx, 1);
        }
      }

      this.roleAssignmentsMap.set(node.key, next);
      this.updateNodeCountInTree(mods, node.key, next.length);
    }

    this.rawModules.set(mods);
    this.roleAssignments.set(new Map(this.roleAssignmentsMap));
    this.bulkDialogVisible.set(false);
    this.clearSelection();

    this.messageService.add({
      severity: 'success',
      summary: this.tr('saved'),
      detail: this.tr('changesSaved')
    });
  }

  readonly statusSeverityMap = STATUS_SEVERITY_MAP;

  exportSelectedPermissions(): void {
    const rows: Record<string, string>[] = [];

    for (const node of this.selectedPermissions()) {
      rows.push({
        name: node.data.name,
        status: (node.data['status'] as string) ?? '',
        action: (node.data['action'] as string) ?? '',
        roles: (this.roleAssignmentsMap.get(node.key) ?? [])
          .map((id) => this.getRoleName(id))
          .join('; ')
      });
    }

    if (!rows.length) {
      this.messageService.add({
        severity: 'info',
        summary: this.tr('noData'),
        detail: this.tr('nothingToExport')
      });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: this.tr('exported'),
      detail: this.tr('rowsExported', { count: rows.length })
    });
  }

  getRoleName(roleId: string): string {
    return this.availableRoles().find((r) => r.id === roleId)?.name ?? roleId;
  }

  // ═══════════════════════════════════════════════════════
  //  CARD HELPERS
  // ═══════════════════════════════════════════════════════

  cardStatusSeverity(status: unknown): 'success' | 'warn' | 'secondary' {
    return STATUS_SEVERITY_MAP[status as string] ?? 'secondary';
  }

  isCardItemSelected(item: PermissionNode): boolean {
    return this.selectedPermissions().some((p) => p.key === item.key);
  }

  isCardPermSelected(perm: PermissionNode): boolean {
    const fields = perm.children ?? [];
    if (!fields.length) return this.isCardItemSelected(perm);
    return fields.every((f) => this.isCardItemSelected(f));
  }

  isCardPermIndeterminate(perm: PermissionNode): boolean {
    const fields = perm.children ?? [];
    if (!fields.length) return false;
    const count = fields.filter((f) => this.isCardItemSelected(f)).length;
    return count > 0 && count < fields.length;
  }

  onCardItemToggle(checked: boolean, item: PermissionNode): void {
    const next = checked
      ? [...this.selectedPermissions(), item]
      : this.selectedPermissions().filter((p) => p.key !== item.key);
    this.selectedPermissions.set(next);
  }

  onCardPermToggle(checked: boolean, perm: PermissionNode): void {
    const fields = perm.children ?? [];
    if (fields.length) {
      let next = this.selectedPermissions().filter(
        (p) => !fields.some((f) => f.key === p.key)
      );
      if (checked) next = [...next, ...fields];
      this.selectedPermissions.set(next);
    } else {
      this.onCardItemToggle(checked, perm);
    }
  }

  cardSelectAllPerms(entity: PermissionNode): void {
    const perms = entity.children ?? [];
    const existing = new Set(this.selectedPermissions().map((p) => p.key));
    const toAdd: PermissionNode[] = [];

    for (const perm of perms) {
      const fields = perm.children ?? [];
      if (fields.length) {
        fields.forEach((f) => {
          if (!existing.has(f.key)) toAdd.push(f);
        });
      } else {
        if (!existing.has(perm.key)) toAdd.push(perm);
      }
    }

    if (toAdd.length) {
      this.selectedPermissions.set([...this.selectedPermissions(), ...toAdd]);
    }
  }

  // ── 9. Private helpers ──────────────────────────────────────────────────────

  /** ✅ NEW: one-shot data loader — called on init and on lang change */
  private loadData(): void {
    this.dataSvc
      .getData$()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ modules, roles, roleAssignments, translations }) => {
        // Seed roleAssignmentsMap from the API response
        this.roleAssignmentsMap.clear();
        for (const [key, roleIds] of roleAssignments ?? []) {
          this.roleAssignmentsMap.set(key, roleIds);
        }

        const mods = this.shallowCloneModuleTree(modules);
        this.roleAssignmentsMap.forEach((roleIds, key) => {
          this.updateNodeCountInTree(mods, key, roleIds.length);
        });
        this.roleAssignments.set(new Map(this.roleAssignmentsMap));
        this.rawModules.set(mods);
        this.availableRoles.set(roles);
        this.translations.set(translations);
        this.clearSelection();
        this.buildColumnDefs(translations);
      });
  }

  private tr(key: string, params?: Record<string, unknown>): string {
    const msg = this.translations()?.messages?.[key] ?? key;
    if (!params) return msg;
    return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
  }

  private buildColumnDefs(tr: PermissionsTranslations): void {
    const statusOpts = buildStatusOptions(tr);
    const cats = new Set<string>();
    const actions = new Set<string>();

    const collect = (nodes: PermissionNode[]): void => {
      for (const n of nodes) {
        if (n.data['category']) cats.add(n.data['category'] as string);
        if (n.data['action']) actions.add(n.data['action'] as string);
        if (n.children) collect(n.children);
      }
    };
    this.rawModules().forEach((m) => collect(m.entities));

    const catOpts = buildCategoryOptionsFromData([...cats].sort());
    const actionOpts = buildActionOptionsFromData([...actions].sort());

    this.entityColumns.set(buildEntityColumns(tr, catOpts, statusOpts));
    this.permColumns.set(buildPermissionColumns(tr, statusOpts, actionOpts));
    this.fieldColumns.set(buildFieldColumns(tr, statusOpts));
  }

  private rebuildDialogCacheForEntity(node: PermissionNode): void {
    const children = node.children ?? [];
    const map = new Map<string, RoleState>();
    for (const role of this.availableRoles()) {
      const count = children.filter((c: PermissionNode) =>
        (this.roleAssignmentsMap.get(c.key) ?? []).includes(role.id)
      ).length;
      map.set(role.id, {
        checked: count === children.length && count > 0,
        indeterminate: count > 0 && count < children.length
      });
    }
    this.dialogRoleStateCache.set(map);
  }

  private rebuildDialogCacheForBulk(): void {
    const nodes = this.selectedPermissions();
    const map = new Map<string, RoleState>();
    for (const role of this.availableRoles()) {
      const count = nodes.filter((n) =>
        (this.roleAssignmentsMap.get(n.key) ?? []).includes(role.id)
      ).length;
      map.set(role.id, {
        checked: count === nodes.length && count > 0,
        indeterminate: count > 0 && count < nodes.length
      });
    }
    this.dialogRoleStateCache.set(map);
  }

  private shallowCloneModuleTree(
    modules: Module[] = this.rawModules()
  ): Module[] {
    return modules.map((m) => ({
      ...m,
      entities: m.entities.map((e) => ({
        ...e,
        children: e.children ? [...e.children] : undefined
      }))
    }));
  }

  private updateNodeCountInTree(
    modules: Module[],
    key: string,
    count: number
  ): boolean {
    const walk = (nodes: PermissionNode[]): boolean => {
      for (const node of nodes) {
        if (node.key === key) {
          node.data = { ...node.data, assignedRolesCount: count };
          return true;
        }
        if (node.children && walk(node.children)) return true;
      }
      return false;
    };
    for (const mod of modules) {
      if (walk(mod.entities)) return true;
    }
    return false;
  }

  private findNodeByKey(key: string, mods?: Module[]): PermissionNode | null {
    const find = (nodes: PermissionNode[]): PermissionNode | null => {
      for (const n of nodes) {
        if (n.key === key) return n;
        if (n.children) {
          const f = find(n.children);
          if (f) return f;
        }
      }
      return null;
    };
    for (const m of mods ?? this.rawModules()) {
      const f = find(m.entities);
      if (f) return f;
    }
    return null;
  }
}
