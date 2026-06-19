import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { ProjectConfig } from '@/app/foundation/core/models';

interface PlatformRow {
  project: ProjectConfig;
  safeLogo: SafeHtml;
  isActive: boolean;
}

@Component({
  selector: 'app-builder-platforms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './builder-platforms.html',
  styleUrl: './builder-platforms.scss'
})
export class BuilderPlatformsPage {
  private readonly configSvc = inject(ProjectConfigService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly rows = computed<PlatformRow[]>(() =>
    this.configSvc.availableProjects().map((p) => ({
      project: p,
      safeLogo: this._safeLogo(p),
      isActive: p.id === this.configSvc.activeProjectId()
    }))
  );

  private _safeLogo(project: ProjectConfig): SafeHtml {
    const svg = project.logoSvg.replace(/var\(--primary-color\)/g, project.primaryColor);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  apply(project: ProjectConfig): void {
    this.configSvc.switchProject(project);
  }

  trackById(_: number, row: PlatformRow): string {
    return row.project.id;
  }
}
