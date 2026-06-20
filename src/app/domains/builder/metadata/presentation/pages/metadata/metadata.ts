import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';

import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';

export interface MetadataEntity {
  name: string;
}

export interface MetadataModule {
  name: string;
  entities: MetadataEntity[];
  collapsed: boolean;
}

export interface MetadataDomain {
  name: string;
  modules: MetadataModule[];
  collapsed: boolean;
}

// ── Raw domain → module → entity definition ───────────────────────────────
const DOMAINS_SOURCE: Record<string, Record<string, string[]>> = {
  IAM: {
    authorization: ['Users', 'Roles', 'Permission']
  },
  Identity: {
    Organization: ['Organization', 'Communities', 'Contacts']
  },
  Transport: {
    Vessels: ['Vessels', 'Visits', 'Topics']
  },
  Exchange: {
    Messages: ['Schemas', 'Messages'],
    Processes: ['Processes', 'Conversations']
  },
  Connectivity: {
    Infrastructure: ['servers']
  }
};

function buildDomains(
  source: Record<string, Record<string, string[]>>
): MetadataDomain[] {
  return Object.keys(source)
    .sort((a, b) => a.localeCompare(b))
    .map((domainName) => {
      const modulesSource = source[domainName];
      const modules: MetadataModule[] = Object.keys(modulesSource)
        .sort((a, b) => a.localeCompare(b))
        .map((moduleName) => ({
          name: moduleName,
          collapsed: true,
          entities: [...modulesSource[moduleName]]
            .sort((a, b) => a.localeCompare(b))
            .map((entityName) => ({ name: entityName }))
        }));
      return { name: domainName, modules, collapsed: false };
    });
}

@Component({
  selector: 'app-metadata',
  imports: [
    CommonModule,
    PanelModule,
    ButtonModule,
    TranslocoModule,
    DialogShellComponent
  ],
  templateUrl: './metadata.html',
  styleUrl: './metadata.scss'
})
export class Metadata {
  domains = signal<MetadataDomain[]>(buildDomains(DOMAINS_SOURCE));

  dialogVisible = signal(false);
  selectedEntity = signal<MetadataEntity | null>(null);
  selectedModule = signal<MetadataModule | null>(null);
  selectedDomain = signal<MetadataDomain | null>(null);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  openEntity(
    domain: MetadataDomain,
    module: MetadataModule,
    entity: MetadataEntity
  ): void {
    this.selectedDomain.set(domain);
    this.selectedModule.set(module);
    this.selectedEntity.set(entity);
    this.dialogVisible.set(true);
  }

  navigateToEntityDetails(): void {
    const entity = this.selectedEntity();
    if (!entity) return;
    this.dialogVisible.set(false);
    this.router.navigate(['./', entity.name.toLowerCase()], {
      relativeTo: this.route
    });
  }

  toggleDomain(domain: MetadataDomain): void {
    domain.collapsed = !domain.collapsed;
  }

  toggleModule(module: MetadataModule): void {
    module.collapsed = !module.collapsed;
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }
}
