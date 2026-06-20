import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { ProjectConfig } from '@/app/foundation/core/models';

export interface SubProject {
  id: string;
  cleanDescription: string; // نص الوصف الصافي فقط بدون كلمة "الوصف" أو الاسم المكرر
  isActive: boolean;
}

interface PlatformRow {
  project: ProjectConfig;
  displayName: string; // الاسم الجديد المعدل للمنصة
  safeLogo: SafeHtml;
  isActive: boolean;
  description: string;
  children: SubProject[];
  expanded: boolean;
}

type PlatformViewMode = 'table' | 'cards';

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

  readonly viewMode = signal<PlatformViewMode>('table');

  readonly rows = computed<PlatformRow[]>(() =>
    this.configSvc.availableProjects().map((p) => {
      const activeId = this.configSvc.activeProjectId();

      let description = '';
      let displayName = p.projectName || '';
      let cleanChildDesc = '';

      // ضبط الأسماء والأوصاف بناءً على طلبك بدقة
      if (p.projectName?.toLowerCase().includes('simw')) {
        displayName = 'SIMW';
        description = 'مينا اسكندرية - مينا الدخيلة';
        cleanChildDesc = 'مينا اسكندرية - مينا الدخيلة';
      } else if (p.projectName?.toLowerCase().includes('ride') || p.projectName?.toLowerCase().includes('lady')) {
        displayName = 'Ride Share';
        description = 'Lady Driver';
        cleanChildDesc = 'Lady Driver';
      } else if (p.projectName?.toLowerCase().includes('fikra')) {
        displayName = 'I-Fikra';
        description = 'I-Fikra Solutions';
        cleanChildDesc = 'I-Fikra Solutions';
      } else {
        description = p.websiteTitle || '';
        cleanChildDesc = p.websiteTitle || '';
      }

      const children: SubProject[] = [{
        id: p.id,
        cleanDescription: cleanChildDesc,
        isActive: p.id === activeId
      }];

      return {
        project: p,
        displayName,
        safeLogo: this._safeLogo(p),
        isActive: p.id === activeId,
        description,
        children,
        expanded: false,
      };
    })
  );

  private _safeLogo(project: ProjectConfig): SafeHtml {
    const svg = project.logoSvg.replace(/var\(--primary-color\)/g, project.primaryColor);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  apply(project: ProjectConfig): void {
    this.configSvc.switchProject(project);
  }

  toggleExpand(row: PlatformRow): void {
    row.expanded = !row.expanded;
  }

  setViewMode(mode: PlatformViewMode): void {
    this.viewMode.set(mode);
  }

  trackById(_: number, row: PlatformRow): string {
    return row.project.id;
  }

  trackByChildId(_: number, child: SubProject): string {
    return child.id;
  }
}
