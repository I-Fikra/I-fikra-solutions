import { Component, inject, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ThemeSwitcher } from '@/app/foundation/shared/components/theme-switcher';
import { ProfileMenu } from '@/app/foundation/core/layout/component/ProfileMenu';
import { LangSwitcher } from '@/app/foundation/shared/components/lang-switcher/lang-switcher';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeConfigurationStore } from '@/app/foundation/core/theme-builder/theme-configuration.store';
import {
  TopbarNavItem,
  TopbarNavStyle,
} from '@/app/foundation/core/theme-builder/theme-configuration.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    AppConfigurator,
    LangSwitcher,
    ThemeSwitcher,
    TranslocoModule,
    ProfileMenu
  ],
  styles: [`
    /* ── Center Nav ─────────────────────────────────────────── */
    .topbar-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
    .topbar-nav--left  { position: static; transform: none; margin-inline-end: auto; margin-inline-start: 1.5rem; }
    .topbar-nav--right { position: static; transform: none; margin-inline-start: auto; margin-inline-end: 1rem; }

    /* ── Nav Item styles ─────────────────────────────────────── */
    .topbar-nav__item {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem; font-weight: 500;
      color: var(--app-topbar-color, var(--text-color));
      text-decoration: none; white-space: nowrap;
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      border: 2px solid transparent;
    }
    .topbar-nav__item:hover { background: rgba(0,0,0,0.06); }
    .topbar-nav__item.active { background: rgba(0,0,0,0.1); font-weight: 600; }

    /* Pills */
    .topbar-nav--pills .topbar-nav__item { border-radius: 999px; padding: 0.3rem 1rem; }
    .topbar-nav--pills .topbar-nav__item.active { background: var(--primary-color); color: var(--primary-contrast-color, #fff); }

    /* Underline */
    .topbar-nav--underline .topbar-nav__item {
      border-radius: 0; border-bottom: 2px solid transparent; padding-bottom: 0.3rem;
    }
    .topbar-nav--underline .topbar-nav__item.active { border-bottom-color: var(--primary-color); color: var(--primary-color); background: transparent; }

    /* Buttons */
    .topbar-nav--buttons .topbar-nav__item { border: 1.5px solid var(--surface-border); border-radius: 6px; }
    .topbar-nav--buttons .topbar-nav__item.active { border-color: var(--primary-color); color: var(--primary-color); background: transparent; }

    /* ── Topbar logo variants ────────────────────────────────── */
    .topbar-logo--icon-only span.logo-text { display: none; }
    .topbar-logo--text-only span.logo-icon { display: none; }
    .topbar-logo--hidden { display: none !important; }
  `],
  template: `<div class="layout-topbar">

    <!-- ── Logo ─────────────────────────────────────────────── -->
    <div class="layout-topbar-logo-container">
      <button
        class="layout-menu-button layout-topbar-action"
        (click)="layoutService.onMenuToggle()"
      >
        <i class="pi pi-bars"></i>
      </button>
      <a class="layout-topbar-logo {{ logoClass() }}" routerLink="/">
        <span class="logo-icon layout-topbar-logo-icon" [innerHTML]="logoSvg()"></span>
        <span class="logo-text">{{ projectConfigService.projectName() }}</span>
      </a>
    </div>

    <!-- ── Center / Left / Right Nav ────────────────────────── -->
    @if (navItems().length > 0 && navAlign() !== 'right') {
      <nav class="topbar-nav topbar-nav--{{ navAlign() }} topbar-nav--{{ navStyle() }}">
        @for (item of navItems(); track item.id) {
          <a
            class="topbar-nav__item"
            [class.active]="isActive(item.route)"
            [routerLink]="item.route"
          >
            @if (item.icon) { <i [class]="item.icon"></i> }
            {{ item.label }}
          </a>
        }
      </nav>
    }

    <!-- ── Actions (right side) ──────────────────────────────── -->
    <div class="layout-topbar-actions">

      <!-- Right-aligned nav -->
      @if (navItems().length > 0 && navAlign() === 'right') {
        <nav class="topbar-nav topbar-nav--right topbar-nav--{{ navStyle() }}">
          @for (item of navItems(); track item.id) {
            <a
              class="topbar-nav__item"
              [class.active]="isActive(item.route)"
              [routerLink]="item.route"
            >
              @if (item.icon) { <i [class]="item.icon"></i> }
              {{ item.label }}
            </a>
          }
        </nav>
      }

      <div class="layout-config-menu flex items-center">
        @if (showSearch()) {
          <button class="layout-topbar-action" title="Search">
            <i class="pi pi-search"></i>
          </button>
        }
        @if (showNotif()) {
          <button class="layout-topbar-action" title="Notifications">
            <i class="pi pi-bell"></i>
          </button>
        }
        @if (showLang()) {
          <app-lang-switcher></app-lang-switcher>
        }
        @if (showTheme()) {
          <app-theme-switcher></app-theme-switcher>
        }
        @if (showConfig()) {
          <div class="relative">
            <button
              class="layout-topbar-action layout-topbar-action-highlight auth-popup-border"
              pStyleClass="@next"
              enterFromClass="hidden"
              enterActiveClass="animate-scalein"
              leaveToClass="hidden"
              leaveActiveClass="animate-fadeout"
              [hideOnOutsideClick]="true"
            >
              <i class="pi pi-palette"></i>
            </button>
            <app-configurator />
          </div>
        }
      </div>

      <div class="relative">
        <button
          class="layout-topbar-action lang-item"
          pStyleClass="@next"
          enterFromClass="hidden"
          enterActiveClass="animate-scalein"
          leaveToClass="hidden"
          leaveActiveClass="animate-fadeout"
          [hideOnOutsideClick]="true"
        >
          <i class="pi pi-user"></i>
        </button>
        <app-profile-menu></app-profile-menu>
      </div>
    </div>
  </div>`
})
export class AppTopbar {
  items!: MenuItem[];

  readonly layoutService         = inject(LayoutService);
  readonly transloco             = inject(TranslocoService);
  readonly projectConfigService  = inject(ProjectConfigService);
  private readonly sanitizer     = inject(DomSanitizer);
  private readonly themeStore    = inject(ThemeConfigurationStore);
  private readonly router        = inject(Router);
  private readonly platformId    = inject(PLATFORM_ID);

  readonly logoSvg = (): SafeHtml =>
    this.sanitizer.bypassSecurityTrustHtml(this.projectConfigService.logoSvg());

  readonly navItems    = computed<TopbarNavItem[]>(() =>
    this.themeStore.topbar().navItems.filter(i => i.enabled)
  );
  readonly navAlign    = computed(() => this.themeStore.topbar().navAlign);
  readonly navStyle    = computed<TopbarNavStyle>(() => this.themeStore.topbar().navStyle);
  readonly logoClass   = computed<string>(() => `topbar-logo--${this.themeStore.topbar().logoStyle}`);
  readonly showLang    = computed(() => this.themeStore.topbar().showLang);
  readonly showTheme   = computed(() => this.themeStore.topbar().showTheme);
  readonly showConfig  = computed(() => this.themeStore.topbar().showConfig);
  readonly showSearch  = computed(() => this.themeStore.topbar().showSearch);
  readonly showNotif   = computed(() => this.themeStore.topbar().showNotif);

  isActive(route: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.router.isActive(route, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }
}
