import { Component, signal } from '@angular/core';
import { TableComponent } from '@/app/foundation/shared/components/table/table';
import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';
import { TagModule } from 'primeng/tag';
import { USER_ATTRIBUTE_COLUMNS, USER_ATTRIBUTE_ROWS, UserAttributeRow } from './user-attributes.data';

@Component({
  selector: 'app-metadata',
  imports: [TableComponent, DialogShellComponent, TagModule],
  templateUrl: './metadata.html',
  styleUrl: './metadata.scss'
})
export class Metadata {
  columns = USER_ATTRIBUTE_COLUMNS;
  data    = signal(USER_ATTRIBUTE_ROWS);

  // ── Row detail dialog ──────────────────────────────────────────────────────
  selectedRow   = signal<UserAttributeRow | null>(null);
  dialogVisible = signal(false);

  openRow(row: UserAttributeRow): void {
    this.selectedRow.set(row);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  /** CSS severity للـ Tag بتاع النوع */
  typeSeverity(type: string): 'info' | 'success' | 'warn' | 'secondary' | 'contrast' {
    const map: Record<string, 'info' | 'success' | 'warn' | 'secondary' | 'contrast'> = {
      string:   'info',
      number:   'success',
      boolean:  'warn',
      datetime: 'secondary',
      date:     'secondary',
      text:     'info',
      json:     'contrast',
    };
    return map[type] ?? 'secondary';
  }
}