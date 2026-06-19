import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  computed,
  signal,
  effect,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LayoutConfig } from '@/app/foundation/core/models/layout.model';

export interface AppConfig extends LayoutConfig {
  lang: 'en' | 'ar';
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  configSidebarVisible: boolean;
  mobileMenuActive: boolean;
  menuHoverActive: boolean;
  activePath: string | null;
}

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private transloco = inject(TranslocoService);
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'app_config';
  private isInitialized = false;

  // ✅ flag عشان نمنع startViewTransition أثناء الـ initial navigation
  private routerReady = false;

  layoutConfig = signal<AppConfig>({
    preset: 'Aura',
    primary: 'sky',
    surface: 'slate',
    darkTheme: false,
    menuMode: 'static',
    lang: 'ar'
  });

  layoutState = signal<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    configSidebarVisible: false,
    mobileMenuActive: false,
    menuHoverActive: false,
    activePath: null
  });

  isDarkTheme = computed(() => this.layoutConfig().darkTheme);
  isRTL = computed(() => this.layoutConfig().lang === 'ar');
  getPrimary = computed(() => this.layoutConfig().primary);
  getSurface = computed(() => this.layoutConfig().surface);
  isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');
  isSidebarActive = computed(
    () =>
      this.layoutState().overlayMenuActive ||
      this.layoutState().mobileMenuActive
  );

  transitionComplete = signal<boolean>(false);

  constructor() {
    this._initializeConfig();

    effect(() => {
      const config = this.layoutConfig();
      if (!this.isInitialized) return;
      this._saveToLocal(config);
      this._applyBrowserEnvironment(config);
      this._handleDarkModeTransition(config);
    });
  }

  /**
   * يُستدعى من AppLayout بعد ما الـ router ينهي الـ initial navigation.
   * بيسمح لـ startViewTransition تشتغل بأمان.
   */
  markRouterReady(): void {
    this.routerReady = true;
  }

  onMenuToggle(): void {
    if (this.isOverlay()) {
      this.layoutState.update((s) => ({
        ...s,
        overlayMenuActive: !s.overlayMenuActive
      }));
    }

    if (this.isDesktop()) {
      this.layoutState.update((s) => ({
        ...s,
        staticMenuDesktopInactive: !s.staticMenuDesktopInactive
      }));
    } else {
      this.layoutState.update((s) => ({
        ...s,
        mobileMenuActive: !s.mobileMenuActive
      }));
    }
  }

  showConfigSidebar(): void {
    this.layoutState.update((s) => ({ ...s, configSidebarVisible: true }));
  }

  hideConfigSidebar(): void {
    this.layoutState.update((s) => ({ ...s, configSidebarVisible: false }));
  }

  isDesktop(): boolean {
    return window.innerWidth > 991;
  }

  isMobile(): boolean {
    return !this.isDesktop();
  }

  getCurrentConfig(): AppConfig {
    return this.layoutConfig();
  }

  verifyLocalStorage(): AppConfig | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  toggleDarkMode(config?: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const _config = config ?? this.layoutConfig();
    document.documentElement.classList.toggle('app-dark', _config.darkTheme);
  }

  private _initializeConfig(): void {
    const saved = this._loadFromLocal();

    if (saved) {
      this.layoutConfig.set(saved);
    } else {
      this._saveToLocal(this.layoutConfig());
    }

    this._applyBrowserEnvironment(this.layoutConfig());

    // ✅ أثناء الـ init — toggleDarkMode مباشرة بدون startViewTransition
    this.toggleDarkMode(this.layoutConfig());

    this.isInitialized = true;
  }

  private _loadFromLocal(): AppConfig | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return this._validate(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private _validate(c: Partial<AppConfig>): AppConfig {
    return {
      preset: c.preset ?? 'Aura',
      primary: c.primary ?? 'sky',
      surface: c.surface ?? 'slate',
      darkTheme: c.darkTheme ?? false,
      menuMode: c.menuMode ?? 'static',
      lang: c.lang ?? 'ar'
    };
  }

  private _saveToLocal(config: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this._validate(config))
    );
  }

  private _applyBrowserEnvironment(config: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.transloco.setActiveLang(config.lang);
    document.documentElement.lang = config.lang;
    document.documentElement.dir = config.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('p-dark', config.darkTheme);
    document.documentElement.classList.toggle('app-dark', config.darkTheme);
  }

  private _handleDarkModeTransition(config: AppConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // ✅ FIX: منع startViewTransition أثناء الـ initial router navigation
    // كانت بتعمل conflict مع Angular Router وتسبب AbortError
    if ('startViewTransition' in document && this.routerReady) {
      (document as any).startViewTransition(() => this.toggleDarkMode(config));
    } else {
      this.toggleDarkMode(config);
    }
  }
}
