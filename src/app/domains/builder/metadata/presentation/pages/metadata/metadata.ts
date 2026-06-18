import { Component, signal } from '@angular/core';

import { TableComponent } from '@/app/foundation/shared/components/table/table';
import { USER_ATTRIBUTE_COLUMNS, USER_ATTRIBUTE_ROWS } from './user-attributes.data';

/**
 * Metadata page — lists the "user" entity's attributes.
 *
 * Previously rendered via `app-tree-table` with rows grouped by module under
 * a collapsible tree. Migrated to the flat `app-table` component: each row
 * now carries its own `module` column (sortable/filterable) instead of being
 * visually nested, since the underlying data was never actually hierarchical
 * (no row ever had children) — the grouping was presentation-only.
 */
@Component({
  selector: 'app-metadata',
  imports: [TableComponent],
  templateUrl: './metadata.html',
  styleUrl: './metadata.scss'
})
export class Metadata {
  columns = USER_ATTRIBUTE_COLUMNS;
  data = signal(USER_ATTRIBUTE_ROWS);
}
