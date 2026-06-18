import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLoadingService } from './page-loading.service';

@Component({
  selector: 'app-page-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.isLoading()) {
      <div class="page-loading-overlay">
        <div class="page-loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .page-loading-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        padding-top: 10rem;
        background: color-mix(
          in srgb,
          var(--surface-ground, #fff) 70%,
          transparent
        );
        backdrop-filter: blur(2px);
        animation: fade-in 0.15s ease;
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .page-loading-dots {
        display: flex;
        gap: 0.5rem;
      }

      .page-loading-dots span {
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color, #6366f1);
        animation: dot-bounce 1.2s ease-in-out infinite;
      }

      .page-loading-dots span:nth-child(1) {
        animation-delay: 0s;
      }
      .page-loading-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .page-loading-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes dot-bounce {
        0%,
        80%,
        100% {
          transform: scale(0.6);
          opacity: 0.4;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `
  ]
})
export class PageLoadingComponent {
  readonly svc = inject(PageLoadingService);
}
