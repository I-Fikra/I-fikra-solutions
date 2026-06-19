import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import {
  type TableRowSeparator,
  type TableHeaderStyle,
  type ComponentShape,
} from '../../../theme-configuration.model';

const SHAPE_RADIUS_MAP: Record<ComponentShape, string> = {
  sharp:   '3px',
  rounded: '8px',
  soft:    '16px',
  pill:    '24px',
};

const ROW_SEP_MAP: Record<TableRowSeparator, string> = {
  none:    'none',
  thin:    '1px solid rgba(0,0,0,0.08)',
  thick:   '2px solid rgba(0,0,0,0.12)',
  colored: '1px solid var(--primary-color)',
};

const HEADER_BG_MAP: Record<TableHeaderStyle, string> = {
  filled:   'var(--surface-ground)',
  gradient: 'linear-gradient(90deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #8b5cf6))',
  minimal:  'transparent',
};

@Component({
  selector: 'app-table-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './table-preview.component.html',
  styleUrls:   ['./table-preview.component.scss'],
})
export class TablePreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  readonly rows = [0, 1, 2, 3];

  readonly config = computed(() => {
    const tbl   = this.store.table();
    const shape = this.store.shape().globalShape;
    return {
      radius:       SHAPE_RADIUS_MAP[shape],
      striped:      tbl.style === 'striped',
      bordered:     tbl.style === 'bordered',
      minimal:      tbl.style === 'minimal',
      rowSeparator: ROW_SEP_MAP[tbl.rowSeparator],
      colSeparator: tbl.columnSeparator,
      headerBg:     HEADER_BG_MAP[tbl.headerStyle],
      headerColor:  tbl.headerStyle === 'gradient' ? '#fff' : 'var(--text-color-secondary)',
    };
  });
}
