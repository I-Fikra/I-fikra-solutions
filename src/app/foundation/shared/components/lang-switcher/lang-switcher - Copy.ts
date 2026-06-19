import {
  Component,
  inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SettingsService } from '@/app/foundation/core/settings/settings.service';
import { isPlatformBrowser } from '@angular/common';
import { PopupShell } from '@/app/foundation/shared/components/popup-shell/popup-shell';
import { StyleClassModule } from 'primeng/styleclass';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule, TranslocoModule, PopupShell, StyleClassModule],
  template: ` <div class="lang-switcher relative">
    <button
      #langButton
      type="button"
      class="layout-topbar-action"
      (click)="togglePopup()"
    >
      <i class="pi pi-language"></i>
      <!-- <span class="ml-1">{{ currentLang() === 'en' ? 'EN' : 'AR' }}</span> -->
    </button>

    <div
      #langMenu
      class="lang-menu absolute top-14 end-0 origin-top z-50"
      [class.hidden]="!isPopupOpen"
    >
      <app-popup-shell>
        <div class="app-popup-menu app-popup-menu__inner">
          <div class="app-popup-menu__header">
            <div class="app-popup-avatar">
              <i class="pi pi-language"></i>
            </div>
            <div class="app-popup-menu__title">Language</div>
            <div class="app-popup-menu__subtitle">
              Choose your interface language
            </div>
          </div>

          <div class="app-popup-menu__divider"></div>

          <div class="app-popup-menu__list">
            <button
              type="button"
              class="app-popup-menu__item"
              [class.is-active]="currentLang() === 'en'"
              (click)="changeLanguage('en')"
            >
              <span>English</span>
              <span class="app-popup-menu__item-meta">EN</span>
            </button>

            <button
              type="button"
              class="app-popup-menu__item"
              [class.is-active]="currentLang() === 'ar'"
              (click)="changeLanguage('ar')"
            >
              <span class="font-cairo">العربية</span>
              <span class="app-popup-menu__item-meta">AR</span>
            </button>
          </div>
        </div>
      </app-popup-shell>
    </div>
  </div>`,
  styleUrl: './lang-switcher.scss'
})
export class LangSwitcher {
  settingsService = inject(SettingsService);
  private transloco = inject(TranslocoService);
  private platformId = inject(PLATFORM_ID);
  @ViewChild('langButton') langButton!: ElementRef;
  @ViewChild('langMenu') langMenu!: ElementRef;

  // Use a local signal for current language
  currentLang = signal<'en' | 'ar'>('en');

  // Track popup state
  isPopupOpen = false;

  constructor() {
    // Initialize with current language
    const initialLang = this.settingsService.currentLang();
    this.currentLang.set(initialLang);

    // Listen for language changes from settings service
    effect(() => {
      const newLang = this.settingsService.currentLang();
      if (newLang !== this.currentLang()) {
        this.currentLang.set(newLang);
      }
    });

    // Close popup when clicking outside
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  ngOnDestroy() {
    // Clean up event listener
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  togglePopup() {
    this.isPopupOpen = !this.isPopupOpen;
  }

  closePopup() {
    this.isPopupOpen = false;
  }

  handleClickOutside(event: MouseEvent) {
    if (this.isPopupOpen && this.langMenu && this.langButton) {
      const clickedInside =
        this.langMenu.nativeElement.contains(event.target) ||
        this.langButton.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closePopup();
      }
    }
  }

  changeLanguage(lang: 'en' | 'ar'): void {
    this.currentLang.set(lang);
    this.settingsService.updatePreference('language', lang);

    if (isPlatformBrowser(this.platformId)) {
      this.transloco.setActiveLang(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    this.closePopup();
  }
}
