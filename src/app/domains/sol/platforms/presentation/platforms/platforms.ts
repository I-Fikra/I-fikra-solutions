import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { ProjectConfig } from '@/app/foundation/core/models';

@Component({
  selector: 'app-platforms',
  imports: [CommonModule],
  templateUrl: './platforms.html',
  styleUrl: './platforms.scss'
})
export class Platforms {
  readonly configSvc = inject(ProjectConfigService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly projectId = toSignal(
    this.route.params.pipe(map((p) => p['id'] as string)),
    { initialValue: '' }
  );

  readonly project = computed(() =>
    this.configSvc.availableProjects().find((p) => p.id === this.projectId()) ?? null
  );

  readonly isActive = computed(
    () => this.project()?.id === this.configSvc.activeProjectId()
  );

  safeLogo(project: ProjectConfig): SafeHtml {
    const svg = project.logoSvg.replace(/var\(--primary-color\)/g, project.primaryColor);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  apply(): void {
    const p = this.project();
    if (p) this.configSvc.switchProject(p);
  }
}
