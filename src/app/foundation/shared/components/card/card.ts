import {
  Component,
  ContentChild,
  TemplateRef,
  Output,
  EventEmitter,
  input
} from '@angular/core';
import { NgTemplateOutlet, NgClass } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './card.html',
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .clickable-card {
      outline: 1px solid transparent;
      outline-offset: -1px;
      transition:
        box-shadow 250ms ease,
        outline-color 250ms ease,
        transform 250ms ease;

      &:hover {
        box-shadow:
          0 4px 16px 0
            color-mix(in srgb, var(--p-primary-color) 15%, transparent),
          0 1px 4px 0 rgba(0, 0, 0, 0.08);
        outline-color: color-mix(
          in srgb,
          var(--p-primary-color) 40%,
          transparent
        );
        transform: translateY(-1px);
      }
    }
  `
})
export class Card {
  // ── Content projection (full custom template) ──────────────────────────────
  @ContentChild('cardHeader') headerTemplate?: TemplateRef<unknown>;
  @ContentChild('cardBody') bodyTemplate?: TemplateRef<unknown>;
  @ContentChild('cardFooter') footerTemplate?: TemplateRef<unknown>;

  // ── Dynamic inputs (simple string/number content) ──────────────────────────
  title = input<string>('');
  subtitle = input<string>('');
  footerText = input<string>('');

  // ── Clickable ──────────────────────────────────────────────────────────────
  @Output() cardClick = new EventEmitter<void>();

  get isClickable(): boolean {
    return this.cardClick.observed;
  }

  get hasHeader(): boolean {
    return !!this.headerTemplate || !!this.title() || !!this.subtitle();
  }

  // get hasFooter(): boolean {
  //   return !!this.footerTemplate || !!this.footerText();
  // }

  handleClick(): void {
    if (this.isClickable) this.cardClick.emit();
  }
}
