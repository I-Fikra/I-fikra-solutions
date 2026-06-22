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

const GRID_COLUMNS = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
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

  readonly skeletonRows = Array.from({ length: 2 });
  readonly skeletonCols = Array.from({ length: GRID_COLUMNS });

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

  rows = computed(() => chunk(this.results(), GRID_COLUMNS));

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

  // ── Methods ───────────────────────────────────────────────────────────────
  async open(event: Event): Promise<void> {
    if (this.disabled()) return;

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

  clear(): void {
    this.iconChange.emit(null);
    this.close();
  }
}
