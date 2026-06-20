import { Component, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { PageLoadingComponent } from '@/app/foundation/shared/components/loading/page-loading.component';
import {
  ThemePersonalityService,
  applyComponentDetails,
  applyColorZones,
  tokensFromCustom,
} from '@/app/foundation/core/theme-builder/theme-personality.service';
import { ThemeConfigurationStore } from '@/app/foundation/core/theme-builder/theme-configuration.store';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    AppTopbar,
    AppSidebar,
    RouterModule,
    AppFooter,
    PageLoadingComponent
  ],
  template: `<div class="layout-wrapper" [ngClass]="containerClass()">
    <app-topbar></app-topbar>
    <app-sidebar></app-sidebar>
    <div class="layout-main-container">
      <div class="layout-main" style="position:relative">
        <app-page-loading />
        <router-outlet></router-outlet>
      </div>
      <app-footer></app-footer>
    </div>
    <div class="layout-mask"></div>
  </div> `
})
export class AppLayout {
  layoutService          = inject(LayoutService);
  private personalitySvc = inject(ThemePersonalityService);
  private themeStore     = inject(ThemeConfigurationStore);
  private platformId     = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // ── 1. ThemeConfigurationStore (new) — push all CSS vars eagerly ──────
      //    applyNow() writes every CSS variable to documentElement immediately,
      //    before Angular's first change-detection cycle, so there's no flash
      //    of un-styled components even if localStorage has no saved config
      //    (defaults are written automatically in that case).
      this.themeStore.applyNow();

      // ── 2. ThemePersonalityService (legacy) — still active in parallel ────
      //    Kept so that the PersonalityPicker / CustomBuilder continue to work
      //    while the full migration to ThemeConfigurationStore is in progress.
      const custom = this.personalitySvc.customPersonality();
      const root   = document.documentElement;

      applyComponentDetails(custom.componentDetails, root);
      applyColorZones(custom.colorZones, root);

      const tokens = tokensFromCustom(custom);
      this.personalitySvc.applyPersonality(tokens);

      if (custom.topbarAccented && !custom.colorZones.topbarBg) {
        root.style.setProperty('--app-topbar-bg',    'var(--primary-color)');
        root.style.setProperty('--app-topbar-color', '#ffffff');
      }

      const borderStyle = custom.componentDetails.topbarBorderStyle;
      if (borderStyle === 'shadow') {
        root.style.setProperty('--app-topbar-border', 'none');
        root.style.setProperty('--app-topbar-shadow', '0 2px 8px rgba(0,0,0,0.08)');
      } else {
        root.style.setProperty('--app-topbar-shadow', 'none');
      }
    }

    effect(() => {
      const state = this.layoutService.layoutState();
      if (state.mobileMenuActive) {
        document.body.classList.add('blocked-scroll');
      } else {
        document.body.classList.remove('blocked-scroll');
      }
    });
  }

  containerClass = computed(() => {
    const config = this.layoutService.layoutConfig();
    const state  = this.layoutService.layoutState();
    return {
      'layout-overlay':          config.menuMode === 'overlay',
      'layout-static':           config.menuMode === 'static',
      'layout-static-inactive':  state.staticMenuDesktopInactive && config.menuMode === 'static',
      'layout-overlay-active':   state.overlayMenuActive,
      'layout-mobile-active':    state.mobileMenuActive
    };
  });
}
