import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageLoadingService {
  private _count = signal(0);

  /** true لما يكون فيه request واحد على الأقل شغال */
  readonly isLoading = computed(() => this._count() > 0);

  show(): void { this._count.update(n => n + 1); }

  hide(): void { this._count.update(n => Math.max(0, n - 1)); }
}
