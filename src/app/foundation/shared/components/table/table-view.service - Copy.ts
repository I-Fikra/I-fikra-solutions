import { Injectable, signal, computed } from '@angular/core';
import { TableColumn } from '../../models/table.models';
import { resolveFilterType } from '../../utils/table.utils';

/**
 * TableViewService
 * ─────────────────
 * مسؤول بس عن الـ view/style logic الخاصة بالتابل:
 *  - sort indicators (icons, active state)
 *  - column capabilities (sortable, filterable, canShowActions)
 *  - filter type resolution
 *  - card layout helpers (fieldIndex, footerContent, validDate)
 *
 * الـ data logic (filter engine, CRUD, selection) فاضل في TableComponent.
 */
@Injectable()
export class TableViewService {
  // ── Sort state ────────────────────────────────────────────────────────────

  readonly activeSortField = signal('');
  readonly activeSortOrder = signal<1 | -1>(1);

  setSortState(field: string, order: 1 | -1): void {
    this.activeSortField.set(field);
    this.activeSortOrder.set(order);
  }

  clearSortState(): void {
    this.activeSortField.set('');
    this.activeSortOrder.set(1);
  }

  // ── Sort icons ────────────────────────────────────────────────────────────

  isColumnSorted(col: TableColumn): boolean {
    return this.activeSortField() === col.field;
  }

  getSortIcon(col: TableColumn): string {
    if (this.activeSortField() !== col.field) return '';
    return this.activeSortOrder() === 1
      ? 'pi-sort-amount-up-alt'
      : 'pi-sort-amount-down-alt';
  }

  getSortAscIcon(col: TableColumn): string {
    return this.activeSortField() === col.field && this.activeSortOrder() === 1
      ? 'pi pi-check'
      : 'pi pi-sort-amount-up-alt';
  }

  getSortDescIcon(col: TableColumn): string {
    return this.activeSortField() === col.field && this.activeSortOrder() === -1
      ? 'pi pi-check'
      : 'pi pi-sort-amount-down-alt';
  }

  // ── Column capabilities ───────────────────────────────────────────────────

  isSortable(col: TableColumn): boolean {
    return col.sortable !== false;
  }

  isFilterable(col: TableColumn): boolean {
    return col.filterable !== false;
  }

  canShowHeaderActions(col: TableColumn): boolean {
    return this.isSortable(col) || this.isFilterable(col);
  }

  getFilterType(col: TableColumn): string {
    return resolveFilterType(col);
  }

  // ── Card layout helpers ───────────────────────────────────────────────────

  /** Guard against placeholder values like "—" that the API sends instead of null */
  isValidDate(value: unknown): boolean {
    if (!value || typeof value === 'boolean') return false;
    const s = String(value).trim();
    if (!s || s === '—' || s === '-' || s === 'N/A' || s === 'null' || s === 'undefined')
      return false;
    return !isNaN(new Date(s).getTime());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasCardFooterContent(item: any, columns: TableColumn[]): boolean {
    if (item['tags']) return true;
    return columns.some(
      (col) => col.type === 'date' && this.isValidDate(item[col.field])
    );
  }

  // ✅ PERF: cached map بدل O(n) slice+filter على كل render
  private _cardFieldIndexCache = new Map<string, number>();
  private _cardFieldIndexCacheKey = '';

  getCardFieldIndex(col: TableColumn, columns: TableColumn[]): number {
    const cacheKey = columns.map((c) => c.field).join(',');
    if (cacheKey !== this._cardFieldIndexCacheKey) {
      this._cardFieldIndexCache.clear();
      this._cardFieldIndexCacheKey = cacheKey;
      let bodyIdx = 0;
      columns.forEach((c, i) => {
        if (i !== 0 && c.type !== 'status' && !c.isStatus) {
          this._cardFieldIndexCache.set(c.field, bodyIdx++);
        }
      });
    }
    return this._cardFieldIndexCache.get(col.field) ?? 0;
  }

  /** CSS class للـ sort button — active vs. idle */
  getSortBtnClass(col: TableColumn, order: 1 | -1): string {
    return this.isColumnSorted(col) && this.activeSortOrder() === order
      ? 'sort-btn sort-btn--active'
      : 'sort-btn';
  }
}
