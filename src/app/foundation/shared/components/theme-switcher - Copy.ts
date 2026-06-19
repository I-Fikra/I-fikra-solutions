import { SettingsService } from '@/app/foundation/core/settings/settings.service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="layout-topbar-action" (click)="toggleTheme()">
      <i
        [ngClass]="{
          pi: true,
          'pi-moon': settingsService.isDarkMode(),
          'pi-sun': !settingsService.isDarkMode()
        }"
      ></i>
    </button>
  `
})
export class ThemeSwitcher {
  settingsService = inject(SettingsService);

  toggleTheme(): void {
    this.settingsService.updatePreference(
      'darkMode',
      !this.settingsService.isDarkMode()
    );
  }
}
