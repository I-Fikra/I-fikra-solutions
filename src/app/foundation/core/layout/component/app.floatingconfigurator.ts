import { Component, computed, inject, input, effect } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { LangSwitcher } from '../../../shared/components/lang-switcher/lang-switcher';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-floating-configurator',
  imports: [
    CommonModule,
    ButtonModule,
    StyleClassModule,
    AppConfigurator,
    LangSwitcher
  ],
  template: `
    <div class="flex gap-4 top-8 end-8 " [ngClass]="{ fixed: float() }">
      <app-lang-switcher></app-lang-switcher>
      <p-button
        type="button"
        (onClick)="toggleDarkMode()"
        [rounded]="true"
        [icon]="isDarkTheme() ? 'pi pi-moon' : 'pi pi-sun'"
        severity="secondary"
      />
      <div class="relative">
        <p-button
          icon="pi pi-palette"
          pStyleClass="@next"
          enterFromClass="hidden"
          enterActiveClass="animate-scalein"
          leaveToClass="hidden"
          leaveActiveClass="animate-fadeout"
          [hideOnOutsideClick]="true"
          type="button"
          rounded
        />
        <app-configurator />
      </div>
    </div>
  `
})
export class AppFloatingConfigurator {
  private LayoutService = inject(LayoutService);

  float = input<boolean>(true);
  isDarkTheme = computed(() => this.LayoutService.layoutConfig().darkTheme);

  // Remove constructor and all persistence methods

  toggleDarkMode() {
    console.log('🌓 Toggling dark mode');
    this.LayoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }
}
