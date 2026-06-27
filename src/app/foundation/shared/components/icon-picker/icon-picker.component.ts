import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Popover, PopoverModule } from 'primeng/popover';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoModule } from '@jsverse/transloco';

import { Icon } from './models/icon.model';
import { IconStoreService } from './services/icon-store.service';

const CELL_WIDTH = 40;
const CELL_HEIGHT = 40;
const CELL_GAP = 4;
const ROW_ITEM_SIZE = CELL_HEIGHT + CELL_GAP;
// Reserved via `scrollbar-gutter: stable` on .icon-picker-viewport so it's
// always subtracted, scrollbar visible or not — otherwise the last column
// gets clipped by .icon-grid-row's overflow: hidden once a real (non-overlay)
// scrollbar actually appears and eats into the row's content width.
const SCROLLBAR_GUTTER = 16;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ScrollingModule,
    PopoverModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SkeletonModule,
    TranslocoModule
  ],
  templateUrl: './icon-picker.component.html',
  styleUrl: './icon-picker.component.scss'
})
export class IconPickerComponent {
  private readonly store = inject(IconStoreService);

  // ── Inputs ────────────────────────────────────────────────────────────────
  value = input<string | null>(null);
  filter = input<((icon: Icon) => boolean) | undefined>(undefined);
  placeholder = input<string>('');
  disabled = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  iconChange = output<Icon | null>();

  // ── ViewChild ─────────────────────────────────────────────────────────────
  @ViewChild('panel') panel!: Popover;

  // ── Internal state ───────────────────────────────────────────────────────
  query = signal('');
  isOpen = signal(false);
  isLoading = signal(false);
  panelWidth = signal<number | null>(null);
  panelStyle = computed(() => {
    const width = this.panelWidth();
    return width ? { width: `${width}px` } : null;
  });

  readonly rowItemSize = ROW_ITEM_SIZE;
  readonly skeletonRows = Array.from({ length: 4 });

  // ── Derived ──────────────────────────────────────────────────────────────
  baseList = computed(() => {
    const fn = this.filter();
    const all = this.store.getAll();
    return fn ? all.filter(fn) : all;
  });

  results = computed(() => {
    const q = this.query().trim();
    const fn = this.filter();
    if (q.length < 2) return this.baseList();
    const hits = this.store.search(q);
    return fn ? hits.filter(fn) : hits;
  });

  /** How many fixed-width cells fit per row at the popover's current width. */
  columnsPerRow = computed(() => {
    const width = this.panelWidth() ?? 280;
    const usable = width - 16 - SCROLLBAR_GUTTER; // row padding (0 8px each side) + scrollbar gutter
    return Math.max(2, Math.floor((usable + CELL_GAP) / (CELL_WIDTH + CELL_GAP)));
  });

  rows = computed(() => chunk(this.results(), this.columnsPerRow()));

  selectedIcon = computed(() => {
    const id = this.value();
    if (!id) return null;
    return this.store.getAll().find((icon) => icon.id === id) ?? null;
  });

  statusInfo = computed(() => {
    const q = this.query().trim();
    if (q.length < 2) {
      return { searching: false as const, count: this.baseList().length, query: q };
    }
    return { searching: true as const, count: this.results().length, query: q };
  });

  trackRow = (index: number, row: Icon[]): string => row[0]?.id ?? `empty-${index}`;

  skeletonColumns = computed(() => Array.from({ length: this.columnsPerRow() }));

  // ── Methods ───────────────────────────────────────────────────────────────
  async open(event: Event): Promise<void> {
    if (this.disabled()) return;

    const trigger = event.currentTarget as HTMLElement;
    const measured = trigger.offsetWidth;
    this.panelWidth.set(Math.max(280, Math.min(measured, window.innerWidth * 0.9)));

    this.panel.show(event);
    this.isOpen.set(true);

    if (!this.store.icons()) {
      this.isLoading.set(true);
      try {
        await this.store.load();
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  close(): void {
    this.panel.hide();
  }

  onPanelHide(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  onSearch(value: string): void {
    this.query.set(value);
  }

  select(icon: Icon): void {
    this.iconChange.emit(icon);
    this.close();
  }

  /** Invoked from the trigger's clear (x) icon — the popover is always closed
   *  at this point, so reset state directly instead of going through close(). */
  clear(): void {
    this.iconChange.emit(null);
    this.isOpen.set(false);
    this.query.set('');
  }
}
