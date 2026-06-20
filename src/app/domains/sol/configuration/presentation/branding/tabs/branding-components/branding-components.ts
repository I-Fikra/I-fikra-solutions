import { Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import {
  BrandingConfig,
  PLATFORM_COMPONENT_TYPES,
  PlatformComponentType
} from '@/app/services/sol/configuration/infrastructure/branding.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-branding-components',
  imports: [TranslocoPipe],
  templateUrl: './branding-components.html',
  encapsulation: ViewEncapsulation.None
})
export class BrandingComponents {
  readonly form = input.required<BrandingConfig>();
  readonly submitted = input<boolean>(false);
  readonly patch = output<Partial<BrandingConfig>>();

  /** Catalog of products the platform builder can generate — see `PLATFORM_COMPONENT_TYPES`. */
  readonly componentTypes: readonly PlatformComponentType[] = PLATFORM_COMPONENT_TYPES;

  quantityFor(key: string): number {
    return this.form().platformComponents[key] ?? 0;
  }

  isSelected(key: string): boolean {
    return this.quantityFor(key) > 0;
  }

  /** Clicking a product card toggles it on (quantity 1) or off (quantity 0). */
  toggle(key: string): void {
    this.setQuantity(key, this.isSelected(key) ? 0 : 1);
  }

  increment(key: string, event: Event): void {
    event.stopPropagation();
    this.setQuantity(key, this.quantityFor(key) + 1);
  }

  decrement(key: string, event: Event): void {
    event.stopPropagation();
    this.setQuantity(key, this.quantityFor(key) - 1);
  }

  private setQuantity(key: string, quantity: number): void {
    const current = this.form().platformComponents;
    this.patch.emit({
      platformComponents: { ...current, [key]: Math.max(0, quantity) }
    });
  }

  readonly selection = computed(() =>
    this.componentTypes
      .map((type) => ({ type, quantity: this.quantityFor(type.key) }))
      .filter((entry) => entry.quantity > 0)
  );

  readonly hasSelection = computed(() => this.selection().length > 0);

  readonly totalCount = computed(() =>
    this.selection().reduce((sum, entry) => sum + entry.quantity, 0)
  );
}
