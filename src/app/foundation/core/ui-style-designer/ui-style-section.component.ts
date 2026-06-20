import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UIStyleDesignerComponent } from './ui-style-designer.component';
import { UIStyleDesignerService } from './ui-style-designer.service';

@Component({
  selector: 'app-ui-style-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ButtonModule, ToastModule, UIStyleDesignerComponent],
  providers: [MessageService],
  templateUrl: './ui-style-section.component.html',
  styleUrl: './ui-style-section.component.scss',
})
export class UIStyleSectionComponent {
  private readonly svc = inject(UIStyleDesignerService);
  private readonly messageService = inject(MessageService);

  readonly done = output<void>();

  // ── Default template metadata ─────────────────────────────────────────────
  readonly templateName = 'Website Default Style';

  /** Real screenshots of the rendered website for this template — flip through them in the gallery. */
  readonly templateImages: string[] = [
    'assets/images/templates/default/preview-1.png',
    'assets/images/templates/default/preview-2.png',
    'assets/images/templates/default/preview-3.png',
    'assets/images/templates/default/preview-4.png',

  ];

  /** Whether this template is the one currently applied to the website. */
  readonly isSelected = signal(true);

  // ── Advanced designer toggle ──────────────────────────────────────────────
  readonly showAdvanced = signal(false);

  openAdvanced(): void {
    this.showAdvanced.set(true);
  }

  closeAdvanced(): void {
    this.showAdvanced.set(false);
  }

  // ── Screenshots gallery (lightbox) ────────────────────────────────────────
  readonly galleryOpen = signal(false);
  readonly galleryIndex = signal(0);

  /** Opens the gallery so the user can flip through the template's real screenshots — no selection happens here. */
  openGallery(startIndex = 0): void {
    this.galleryIndex.set(startIndex);
    this.galleryOpen.set(true);
  }

  closeGallery(): void {
    this.galleryOpen.set(false);
  }

  nextImage(): void {
    this.galleryIndex.update((i) => (i + 1) % this.templateImages.length);
  }

  prevImage(): void {
    this.galleryIndex.update(
      (i) => (i - 1 + this.templateImages.length) % this.templateImages.length
    );
  }

  goToImage(index: number): void {
    this.galleryIndex.set(index);
  }

  @HostListener('document:keydown', ['$event'])
  onGalleryKeydown(event: KeyboardEvent): void {
    if (!this.galleryOpen()) return;
    if (event.key === 'Escape') this.closeGallery();
    if (event.key === 'ArrowRight') this.nextImage();
    if (event.key === 'ArrowLeft') this.prevImage();
  }

  // ── Selecting the template ────────────────────────────────────────────────
  /**
   * يطبّق التمبلت ده مباشرة — تقدر تنده عليها من على الكارت نفسه أو من
   * جوّه الـ gallery، من غير ما يكون لازم تفتح المعاينة الأول.
   */
  useTemplate(): void {
    this.isSelected.set(true);
    this.galleryOpen.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Template Selected',
      detail: `${this.templateName} applied to your website.`,
      life: 2000,
    });

    setTimeout(() => this.done.emit(), 600);
  }
}