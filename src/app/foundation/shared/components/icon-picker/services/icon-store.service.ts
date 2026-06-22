import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Fuse, { IFuseOptions } from 'fuse.js';
import { Icon } from '../models/icon.model';

const MANIFEST_URL = 'icons/icons-manifest.json';

const FUSE_OPTIONS: IFuseOptions<Icon> = {
  keys: ['name', 'tags', 'category'],
  threshold: 0.3,
  minMatchCharLength: 2,
  includeScore: false
};

@Injectable({ providedIn: 'root' })
export class IconStoreService {
  private readonly http = inject(HttpClient);

  readonly icons = signal<Icon[] | null>(null);

  private index: Fuse<Icon> | null = null;
  private inflight: Promise<Icon[]> | null = null;

  /** Fetches the icon manifest once and builds the search index; safe to call from multiple pickers at once. */
  load(): Promise<Icon[]> {
    const loaded = this.icons();
    if (loaded) return Promise.resolve(loaded);
    if (this.inflight) return this.inflight;

    this.inflight = firstValueFrom(this.http.get<Icon[]>(MANIFEST_URL))
      .then((icons) => {
        this.index = new Fuse(icons, FUSE_OPTIONS);
        this.icons.set(icons);
        return icons;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  search(query: string): Icon[] {
    if (!this.index) return [];
    return this.index.search(query).map((result) => result.item);
  }

  getAll(): Icon[] {
    return this.icons() ?? [];
  }
}
