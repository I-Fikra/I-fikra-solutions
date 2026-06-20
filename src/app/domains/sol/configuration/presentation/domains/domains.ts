import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';

import { SharedToolbarComponent } from '@/app/foundation/shared/components/toolbar/shared-toolbar.component';
import {
  ConfigDataService,
  ConfigTranslations,
  ConfigModule
} from '@/app/domains/sol/configuration/infrastructure/config-data.service';
import { BrandingService } from '@/app/domains/sol/configuration/infrastructure/branding.service';
import { SolutionConfig, SolutionMenuItem } from '@/app/foundation/core/models/solution-config.model';

@Component({
  selector: 'app-domains',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    PopoverModule,
    TagModule,
    SharedToolbarComponent
  ],
  templateUrl: './domains.html',
  styleUrls: ['./domains.scss'],
  providers: [MessageService, ConfirmationService]
})
export class Domains implements OnInit, OnDestroy {
  translations = signal<ConfigTranslations | null>(null);
  globalSearchText = signal('');
  loading = signal(true);
  selectedMenuItems = signal<MenuItem[]>([]);

  public allModules = signal<ConfigModule[]>([]);
  activeModuleKey = signal<string | null>(null);

  // ── Generated SolutionConfig preview ──────────────────────────────────────
  generatedSolution = signal<SolutionConfig | null>(null);
  showPreviewDialog = signal(false);

  private readonly destroy$ = new Subject<void>();
  private readonly dataService = inject(ConfigDataService);
  private readonly brandingService = inject(BrandingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  tr = computed(() => this.translations() ?? ({} as ConfigTranslations));

  filteredModules = computed(() => {
    const q = this.globalSearchText().trim().toLowerCase();
    if (!q) return this.allModules();
    return this.allModules().filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  });

  activeModule = computed(
    () =>
      this.allModules().find((m) => m.key === this.activeModuleKey()) ?? null
  );

  selectedCount = computed(
    () => this.allModules().filter((m) => m.selected).length
  );

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);
    this.dataService
      .getData$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ translations, modules }) => {
          this.translations.set(translations);
          this.allModules.set(
            modules.map((m) => ({
              ...m,
              features: m.features.map((f) => ({
                ...f,
                subOptions: f.subOptions ? [...f.subOptions] : undefined,
                selectedSubOptions: [] as string[]
              }))
            }))
          );
          this.loading.set(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.detectChanges();
        }
      });
  }

  // ── Module selection ───────────────────────────────────────────────────────
  toggleModuleSelected(key: string): void {
    this.allModules.update((modules) =>
      modules.map((m) => (m.key === key ? { ...m, selected: !m.selected } : m))
    );
  }

  selectAllModules(): void {
    this.allModules.update((modules) =>
      modules.map((m) => ({ ...m, selected: true }))
    );
  }

  clearAllModules(): void {
    this.allModules.update((modules) =>
      modules.map((m) => ({ ...m, selected: false }))
    );
  }

  setActiveModule(key: string): void {
    this.activeModuleKey.set(key);
  }

  // ── Feature toggles ────────────────────────────────────────────────────────
  toggleFeature(moduleKey: string, featureKey: string): void {
    this.allModules.update((modules) =>
      modules.map((m) =>
        m.key !== moduleKey
          ? m
          : {
              ...m,
              features: m.features.map((f) =>
                f.key !== featureKey ? f : { ...f, enabled: !f.enabled }
              )
            }
      )
    );
  }

  // ── Sub-options ────────────────────────────────────────────────────────────
  getSelectedSubOptions(moduleKey: string, featureKey: string): string[] {
    const mod = this.allModules().find((m) => m.key === moduleKey);
    const feat = mod?.features.find((f) => f.key === featureKey) as
      | (NonNullable<typeof mod>['features'][0] & { selectedSubOptions?: string[] })
      | undefined;
    return feat?.selectedSubOptions ?? [];
  }

  toggleSubOption(moduleKey: string, featureKey: string, optKey: string): void {
    this.allModules.update((modules) =>
      modules.map((m) =>
        m.key !== moduleKey
          ? m
          : {
              ...m,
              features: m.features.map((f) => {
                if (f.key !== featureKey) return f;
                const current: string[] = (f as unknown as { selectedSubOptions: string[] }).selectedSubOptions ?? [];
                const updated = current.includes(optKey)
                  ? current.filter((v: string) => v !== optKey)
                  : [...current, optKey];
                return { ...f, selectedSubOptions: updated };
              })
            }
      )
    );
  }

  isSubOptionSelected(
    moduleKey: string,
    featureKey: string,
    optKey: string
  ): boolean {
    return this.getSelectedSubOptions(moduleKey, featureKey).includes(optKey);
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  onSearchChanged(text: string): void {
    this.globalSearchText.set(text);
  }

  // ── Confirm / Generate ─────────────────────────────────────────────────────
  onConfirm(): void {
    const selected = this.allModules().filter((m) => m.selected);

    if (selected.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No modules selected',
        detail: 'Please select at least one module to generate the project.'
      });
      return;
    }

    // Build a SolutionConfig from the selected modules + current branding
    const solution = this.buildSolutionConfig(selected);

    // Store in-memory for preview (no persistence per project rules)
    this.generatedSolution.set(solution);
    this.showPreviewDialog.set(true);

    console.log('[Phase 7] Generated SolutionConfig:', solution);

    this.messageService.add({
      severity: 'success',
      summary: 'Project Generated!',
      detail: `${selected.length} module(s) scaffolded successfully.`
    });
  }

  closePreviewDialog(): void {
    this.showPreviewDialog.set(false);
  }

  /**
   * Maps the selected ConfigModule[] from the generator wizard into a
   * SolutionConfig object (Phase 4 model). Each selected module becomes a
   * top-level SolutionMenuItem; its enabled features become nested items.
   *
   * appName is read from BrandingService (the wizard's own branding step);
   * falls back to 'New Solution' if not yet filled in.
   */
  private buildSolutionConfig(selected: ConfigModule[]): SolutionConfig {
    const appNameLocalized = this.brandingService.appName();
    const appName = appNameLocalized['en'] || appNameLocalized['ar'] || 'New Solution';

    const menuItems: SolutionMenuItem[] = selected.map((mod) => {
      const enabledFeatures = mod.features.filter((f) => f.enabled);

      if (enabledFeatures.length === 0) {
        return {
          label: mod.label,
          icon: mod.icon,
          routerLink: ['/' + mod.key]
        } satisfies SolutionMenuItem;
      }

      return {
        label: mod.label,
        icon: mod.icon,
        items: enabledFeatures.map((f) => ({
          label: f.label,
          routerLink: ['/' + mod.key, f.key]
        }))
      } satisfies SolutionMenuItem;
    });

    return {
      key: selected.map((m) => m.key).join('-'),
      appName,
      logoPath: this.brandingService.logo() ?? '',
      primaryColor: this.brandingService.themeColor(),
      menuItems
    };
  }

  openPreviewDemo(): void {
    const selected = this.allModules()
      .filter((m) => m.selected)
      .map((m) => m.key);
    const routeMap: Record<string, string> = {
      iam: '/iam/users',
      dashboard: '/dashboard'
    };
    const firstRoute = selected.length
      ? routeMap[selected[0]] ?? '/dashboard'
      : '/dashboard';
    window.open(firstRoute, '_blank');
  }

  onAddClicked(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Coming Soon',
      detail: 'Custom module creation will be available soon.'
    });
  }

  onExport(): void {
    const data = JSON.stringify(
      this.allModules()
        .filter((m) => m.selected)
        .map((m) => ({
          module: m.key,
          features: m.features
            .filter((f) => f.enabled)
            .map((f) => ({
              key: f.key,
              subOptions: (f as unknown as { selectedSubOptions: string[] }).selectedSubOptions ?? []
            }))
        })),
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onBottomBarAction(key: string): void {
    if (key === 'export') this.onExport();
  }

  clearSelection(): void {
    this.selectedMenuItems.set([]);
  }

  clearFilters(): void {
    this.globalSearchText.set('');
  }
}