import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Customize } from '@/app/services/sol/configuration/presentation/customize/customize';

@Component({
  selector: 'app-builder-configuration',
  standalone: true,
  imports: [ToastModule, Customize],
  providers: [MessageService],
  template: `
    <p-toast />
    <app-customize (themeApplied)="onThemeApplied()" />
  `
})
export class BuilderConfigurationPage {
  onThemeApplied(): void {
    // Theme / configuration applied
  }
}
