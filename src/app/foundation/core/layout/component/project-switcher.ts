import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { ProjectConfig } from '@/app/foundation/core/models';

@Component({
  selector: 'app-project-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="project-switcher">
      <!-- Toggle button -->
      <button
        class="project-switcher-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
      >
        <span class="project-color-dot" [style.background]="activeColor()"></span>
        <span class="project-switcher-name">{{ configSvc.projectName() }}</span>
        <i class="pi" [class.pi-chevron-up]="isOpen()" [class.pi-chevron-down]="!isOpen()"></i>
      </button>

      <!-- Projects list -->
      @if (isOpen()) {
        <div class="project-switcher-list">
          @for (project of configSvc.availableProjects(); track project.id) {
            <button
              class="project-switcher-item"
              [class.active]="project.id === configSvc.activeProjectId()"
              (click)="select(project)"
            >
              <span class="project-color-dot" [style.background]="project.primaryColor"></span>
              <span>{{ project.projectName }}</span>
              @if (project.id === configSvc.activeProjectId()) {
                <i class="pi pi-check ms-auto"></i>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .project-switcher {
      position: relative;
      padding: 0.75rem 0 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .project-switcher-trigger {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: var(--text-color);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: background 0.15s;

      &:hover {
        background: var(--surface-hover);
      }

      .pi-chevron-up,
      .pi-chevron-down {
        margin-inline-start: auto;
        font-size: 0.75rem;
        opacity: 0.6;
      }
    }

    .project-switcher-list {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      padding: 0.25rem 0 0.25rem;
    }

    .project-switcher-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.45rem 0.75rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: var(--text-color-secondary);
      cursor: pointer;
      font-size: 0.8rem;
      text-align: start;
      transition: background 0.15s, color 0.15s;

      &:hover {
        background: var(--surface-hover);
        color: var(--text-color);
      }

      &.active {
        color: var(--primary-color);
        font-weight: 600;
      }
    }

    .project-color-dot {
      flex-shrink: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .project-switcher-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: start;
    }
  `]
})
export class ProjectSwitcher {
  readonly configSvc = inject(ProjectConfigService);
  readonly isOpen = signal(false);

  readonly activeColor = computed(
    () => this.configSvc.availableProjects()
      .find(p => p.id === this.configSvc.activeProjectId())
      ?.primaryColor ?? 'var(--primary-color)'
  );

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  select(project: ProjectConfig): void {
    this.configSvc.switchProject(project);
    this.isOpen.set(false);
  }
}
