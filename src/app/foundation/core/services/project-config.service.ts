/**
 * ── Config Source of Truth (Phase 3) ──────────────────────────────────────────
 * THIS SERVICE is the single source of truth for the ADMIN SHELL'S OWN
 * branding: active project name, logo, primary color, and document title for
 * *this* admin application (loaded from `/api/projects.json`, switchable
 * between e.g. SIMW / Lady Driver / I-Fikra). It has no menu/route knowledge.
 *
 * This is NOT the sidebar config (see `DOMAINS` in `domain.config.ts`) and NOT
 * the generated-CLIENT-app's own branding form (see `BrandingService` in
 * `services/sol/configuration/infrastructure` — that one's `appName`/`logo`
 * fields describe a *future generated app*, not this admin UI, despite the
 * similar field names).
 *
 * One real touchpoint with `domain.config.ts`: `availableProjects()` is passed
 * into any `ModuleConfig.subModulesFactory()` hook so a sidebar module could,
 * in principle, render different sub-items per active project. No module
 * currently defines that hook.
 */
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { updatePreset } from '@primeuix/themes';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { ProjectConfig } from '@/app/foundation/core/models';
import { generatePalette } from '@/app/foundation/core/utils/color-palette.util';

@Injectable({ providedIn: 'root' })
export class ProjectConfigService {
  private readonly http = inject(HttpClient);
  private readonly layoutService = inject(LayoutService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _config = signal<ProjectConfig | null>(null);
  readonly availableProjects = signal<ProjectConfig[]>([]);

  readonly projectName = computed(() => this._config()?.projectName ?? '');
  readonly activeProjectId = computed(() => this._config()?.id ?? '');

  /** Active logo SVG: uses dark variant when dark mode is on (if provided). */
  readonly logoSvg = computed(() => {
    const cfg = this._config();
    if (!cfg) return '';
    const isDark = this.layoutService.isDarkTheme();
    return (isDark && cfg.logoSvgDark) ? cfg.logoSvgDark : cfg.logoSvg;
  });

  /**
   * Loads initial config + available projects list.
   * Called once at app startup via APP_INITIALIZER.
   */
  load(): Observable<void> {
    return this.http.get<ProjectConfig[]>('/api/projects.json').pipe(
      tap((projects) => {
        this.availableProjects.set(projects);
        const defaultProject = projects.find(p => p.isDefault) ?? projects[0];
        this._applyConfig(defaultProject);
      })
    ) as unknown as Observable<void>;
  }

  /** Switches to a different project immediately (no HTTP call needed). */
  switchProject(project: ProjectConfig): void {
    this._applyConfig(project);
  }

  private _applyConfig(config: ProjectConfig): void {
    this._config.set(config);
    this._applyPrimaryColor(config.primaryColor);
    if (isPlatformBrowser(this.platformId)) {
      document.title = config.websiteTitle;
      this._applyFavicon(config.faviconSvg ?? config.logoSvg);
    }
  }

  private _applyFavicon(svgString: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = encoded;
  }

  private _applyPrimaryColor(color: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const palette = generatePalette(color);

    updatePreset({
      semantic: {
        primary: palette,
        colorScheme: {
          light: {
            primary: {
              color: '{primary.500}',
              contrastColor: '#ffffff',
              hoverColor: '{primary.600}',
              activeColor: '{primary.700}'
            },
            highlight: {
              background: '{primary.50}',
              focusBackground: '{primary.100}',
              color: '{primary.700}',
              focusColor: '{primary.800}'
            }
          },
          dark: {
            primary: {
              color: '{primary.400}',
              contrastColor: '{surface.900}',
              hoverColor: '{primary.300}',
              activeColor: '{primary.200}'
            },
            highlight: {
              background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
              focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
              color: 'rgba(255,255,255,.87)',
              focusColor: 'rgba(255,255,255,.87)'
            }
          }
        }
      }
    });
  }
}